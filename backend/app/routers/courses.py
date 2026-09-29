from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from typing import List, Optional

from app.database import courses_collection
from app.schemas.course import CourseCreate, CourseOut
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/courses", tags=["Courses"])


def course_helper(course) -> dict:
    return {
        "id": str(course["_id"]),
        "code": course["code"],
        "title": course["title"],
        "credits": course["credits"],
        "description": course.get("description"),
        "semester": course.get("semester", 1),
    }


@router.post("/", response_model=CourseOut, dependencies=[Depends(require_role("faculty"))])
async def create_course(payload: CourseCreate):
    existing = await courses_collection.find_one({"code": payload.code})
    if existing:
        raise HTTPException(status_code=400, detail="Course code already exists")
    doc = payload.model_dump()
    result = await courses_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return course_helper(doc)


@router.get("/", response_model=List[CourseOut])
async def list_courses(semester: Optional[int] = None, current_user: dict = Depends(get_current_user)):
    if semester is not None and not 1 <= semester <= 8:
        raise HTTPException(status_code=400, detail="Semester must be between 1 and 8")
    query = ({"$or": [{"semester": 1}, {"semester": {"$exists": False}}]}
             if semester == 1 else ({"semester": semester} if semester is not None else {}))
    courses = await courses_collection.find(query).sort("code", 1).to_list(200)
    return [course_helper(c) for c in courses]


@router.delete("/{course_id}", dependencies=[Depends(require_role("faculty"))])
async def delete_course(course_id: str):
    if not ObjectId.is_valid(course_id):
        raise HTTPException(status_code=400, detail="Invalid course ID")

    result = await courses_collection.delete_one({"_id": ObjectId(course_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"message": "Course deleted"}
