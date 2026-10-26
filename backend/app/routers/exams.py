from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from typing import List
import io

from app.database import exams_collection, enrollments_collection, courses_collection, students_collection
from app.schemas.exam import ExamCreate, ExamResponse
from app.auth import get_current_user, require_role
from app.services.pdf_service import generate_hall_ticket_pdf

router = APIRouter(prefix="/exams", tags=["Exams"])


def exam_helper(e) -> dict:
    return {
        "id": str(e["_id"]),
        "course_id": e["course_id"],
        "title": e["title"],
        "date": e["date"],
        "room_number": e.get("room_number"),
        "semester": e.get("semester", 1),
        "course_code": e.get("course_code"),
        "course_title": e.get("course_title"),
    }


@router.post("/", response_model=ExamResponse, dependencies=[Depends(require_role("faculty"))])
async def schedule_exam(payload: ExamCreate):
    if not ObjectId.is_valid(payload.course_id):
        raise HTTPException(status_code=400, detail="Invalid course ID")
    course = await courses_collection.find_one({"_id": ObjectId(payload.course_id)})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    doc = payload.model_dump()
    # The semester is always taken from the selected course so timetable
    # records cannot accidentally be published under the wrong semester.
    doc["semester"] = course.get("semester", 1)
    doc["course_code"] = course.get("code")
    doc["course_title"] = course.get("title")
    result = await exams_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return exam_helper(doc)


@router.get("/", response_model=List[ExamResponse])
async def list_exams(semester: int | None = None, current_user: dict = Depends(require_role("faculty"))):
    if semester is not None and not 1 <= semester <= 8:
        raise HTTPException(status_code=400, detail="Semester must be between 1 and 8")
    query = ({"$or": [{"semester": 1}, {"semester": {"$exists": False}}]}
             if semester == 1 else ({"semester": semester} if semester is not None else {}))
    docs = await exams_collection.find(query).sort("date", 1).to_list(200)
    return [exam_helper(d) for d in docs]


async def enrolled_exams(current_user: dict, semester: int) -> list[dict]:
    # Older enrollment records did not store a semester; throughout the app
    # those records are treated as Semester 1.
    semester_filter = (
        {"$or": [{"semester": 1}, {"semester": {"$exists": False}}]}
        if semester == 1
        else {"semester": semester}
    )
    enrollments = await enrollments_collection.find({
        "student_id": str(current_user["_id"]),
        "status": {"$ne": "cancelled"},
        **semester_filter,
    }).to_list(200)
    course_ids = [enrollment["course_id"] for enrollment in enrollments]
    if not course_ids:
        return []

    exams = await exams_collection.find({"course_id": {"$in": course_ids}}).sort("date", 1).to_list(200)
    course_lookup = {}
    for course_id in course_ids:
        if ObjectId.is_valid(course_id):
            course = await courses_collection.find_one({"_id": ObjectId(course_id)})
            if course:
                course_lookup[course_id] = course
    for exam in exams:
        course = course_lookup.get(exam["course_id"], {})
        exam["course_code"] = course.get("code", "")
        exam["course_title"] = course.get("title", "Course")
        exam["semester"] = course.get("semester", exam.get("semester", 1))
    return exams


@router.get("/my", response_model=List[ExamResponse], dependencies=[Depends(require_role("student"))])
async def list_my_exams(semester: int = 1, current_user: dict = Depends(get_current_user)):
    if not 1 <= semester <= 8:
        raise HTTPException(status_code=400, detail="Semester must be between 1 and 8")
    return [exam_helper(exam) for exam in await enrolled_exams(current_user, semester)]


@router.get("/my/hall-ticket", dependencies=[Depends(require_role("student"))])
async def download_hall_ticket(semester: int = 1, current_user: dict = Depends(get_current_user)):
    if not 1 <= semester <= 8:
        raise HTTPException(status_code=400, detail="Semester must be between 1 and 8")
    exams = await enrolled_exams(current_user, semester)
    if not exams:
        raise HTTPException(status_code=404, detail="No scheduled examinations found for your enrolled courses in this semester.")

    student_record = await students_collection.find_one({"email": current_user.get("email")})
    student_info = {
        "id": str(current_user["_id"]), "name": current_user.get("name"), "email": current_user.get("email"),
        "department": current_user.get("department", "GENERAL"),
        "roll_number": student_record.get("roll_number") if student_record else None,
    }
    pdf_bytes = generate_hall_ticket_pdf(student_info, exams, semester)
    return StreamingResponse(
        io.BytesIO(pdf_bytes), media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="hall_ticket_semester_{semester}.pdf"'},
    )


@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_role("faculty"))])
async def delete_exam(exam_id: str):
    if not ObjectId.is_valid(exam_id):
        raise HTTPException(status_code=400, detail="Invalid exam ID")
    deleted = await exams_collection.delete_one({"_id": ObjectId(exam_id)})
    if not deleted.deleted_count:
        raise HTTPException(status_code=404, detail="Exam not found")
