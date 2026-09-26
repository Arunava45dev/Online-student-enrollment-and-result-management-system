from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from datetime import datetime
from typing import List

from app.database import enrollments_collection, courses_collection, users_collection
from app.schemas.enrollment import EnrollRequest, EnrollmentOut
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])


async def enrollment_helper(en) -> dict:
    course = None
    if ObjectId.is_valid(en.get("course_id", "")):
        course = await courses_collection.find_one({"_id": ObjectId(en["course_id"])})

    student = None
    if ObjectId.is_valid(en.get("student_id", "")):
        student = await users_collection.find_one({"_id": ObjectId(en["student_id"])})

    course_title = course["title"] if course and "title" in course else None
    return {
        "id": str(en["_id"]),
        "student_id": en["student_id"],
        "student_name": student["name"] if student and "name" in student else None,
        "course_id": en["course_id"],
        "course_name": course_title,
        "course_title": course_title,
        "status": en.get("status", "enrolled"),
        "enrolled_at": en["enrolled_at"].isoformat() if hasattr(en.get("enrolled_at"), "isoformat") else str(en.get("enrolled_at", "")),
        "semester": en.get("semester", course.get("semester", 1) if course else 1),
    }


@router.post("/", response_model=EnrollmentOut, dependencies=[Depends(require_role("student"))])
async def enroll(payload: EnrollRequest, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(payload.course_id):
        raise HTTPException(status_code=400, detail="Invalid course ID")
    course = await courses_collection.find_one({"_id": ObjectId(payload.course_id)})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    already = await enrollments_collection.find_one({
        "student_id": str(current_user["_id"]),
        "course_id": payload.course_id,
        "semester": course.get("semester", 1),
    })
    if already:
        raise HTTPException(status_code=400, detail="Already enrolled in this course")

    doc = {
        "student_id": str(current_user["_id"]),
        "course_id": payload.course_id,
        "semester": course.get("semester", 1),
        "status": "enrolled",
        "enrolled_at": datetime.utcnow(),
    }
    result = await enrollments_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return await enrollment_helper(doc)


@router.get("/me", response_model=List[EnrollmentOut])
async def my_enrollments(semester: int | None = None, current_user: dict = Depends(get_current_user)):
    if semester is not None and not 1 <= semester <= 8:
        raise HTTPException(status_code=400, detail="Semester must be between 1 and 8")
    query = {"student_id": str(current_user["_id"])}
    if semester is not None:
        query["$or"] = ([{"semester": 1}, {"semester": {"$exists": False}}]
                         if semester == 1 else [{"semester": semester}])
    docs = await enrollments_collection.find(query).to_list(200)
    return [await enrollment_helper(d) for d in docs]


@router.get("/", response_model=List[EnrollmentOut], dependencies=[Depends(require_role("admin", "faculty"))])
async def all_enrollments():
    docs = await enrollments_collection.find().to_list(500)
    return [await enrollment_helper(d) for d in docs]


@router.delete("/{enrollment_id}", dependencies=[Depends(require_role("student", "admin"))])
async def cancel_enrollment(enrollment_id: str, current_user: dict = Depends(get_current_user)):
    en = await enrollments_collection.find_one({"_id": ObjectId(enrollment_id)})
    if not en:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    if current_user["role"] == "student" and en["student_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not your enrollment")

    await enrollments_collection.delete_one({"_id": ObjectId(enrollment_id)})
    return {"message": "Enrollment cancelled"}
