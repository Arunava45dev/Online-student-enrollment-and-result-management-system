import re
from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId

from app.database import results_collection, courses_collection, users_collection, students_collection
from app.auth import get_current_user, require_role
from app.schemas.ai import ChatRequest, ChatResponse, SummaryResponse, RemarkRequest, RemarkResponse
from app.services.openai_service import generate_result_summary, enrollment_chat, generate_faculty_remark

router = APIRouter(prefix="/ai", tags=["AI assistant"])


@router.get("/summary", response_model=SummaryResponse)
async def result_summary(semester: int = Query(1, ge=1, le=8), current_user: dict = Depends(get_current_user)):
    student_record = await students_collection.find_one({"email": current_user["email"]})
    if not student_record:
        return {"summary": "No student record found linked to your account email. Ask admin to check the Students registry."}

    query = {"roll_number": student_record["roll_number"]}
    query["$or"] = ([{"semester": 1}, {"semester": {"$exists": False}}]
                    if semester == 1 else [{"semester": semester}])
    docs = await results_collection.find(query).to_list(200)

    results = [
        {"course_name": r["subject_code"], "marks": r["marks"], "grade": r["grade"]}
        for r in docs
    ]

    summary = await generate_result_summary(current_user["name"], results)
    return {"summary": summary}


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest, current_user: dict = Depends(get_current_user)):
    courses = await courses_collection.find().to_list(200)
    courses = [{
        "name": c.get("title", c.get("name", "")), "code": c["code"],
        "seats_taken": 0, "total_seats": 0, "credits": c["credits"]
    } for c in courses]

    history = [h.model_dump() for h in payload.history]
    reply = await enrollment_chat(payload.message, courses, history)
    return {"reply": reply}


@router.post("/remark", response_model=RemarkResponse, dependencies=[Depends(require_role("faculty", "admin"))])
async def faculty_remark(payload: RemarkRequest):
    raw_id = payload.student_id.strip()
    student = None

    # Try resolving student by ObjectId if 24-char hex
    if ObjectId.is_valid(raw_id):
        try:
            student = await students_collection.find_one({"_id": ObjectId(raw_id)})
        except Exception:
            student = None

    # Fallback to roll_number lookup
    if not student:
        student = await students_collection.find_one({"roll_number": {"$regex": f"^{re.escape(raw_id)}$", "$options": "i"}})

    roll_number = student["roll_number"] if student and "roll_number" in student else raw_id

    # Build result query
    result_query = {"roll_number": roll_number}
    if payload.course_id and payload.course_id.strip():
        clean_course = payload.course_id.strip()
        result_query["subject_code"] = {"$regex": f"^{re.escape(clean_course)}$", "$options": "i"}

    # Fetch latest matching result
    result = await results_collection.find_one(result_query, sort=[("_id", -1)])
    if not result:
        if payload.course_id and payload.course_id.strip():
            raise HTTPException(
                status_code=404,
                detail=f"No published result found for roll number '{roll_number}' in course/subject '{payload.course_id.strip()}'.",
            )
        raise HTTPException(
            status_code=404,
            detail=f"No published results found for roll number '{roll_number}'. Please publish results first.",
        )

    student_name = student["name"] if student and "name" in student else f"Student ({roll_number})"
    course_code = result.get("subject_code", payload.course_id or "Course")
    marks = float(result.get("marks", 0))
    grade = str(result.get("grade", "N/A"))

    remark = await generate_faculty_remark(
        student_name=student_name,
        course_name=course_code,
        marks=marks,
        grade=grade,
        context=payload.context.strip() if payload.context else None,
    )

    return {
        "remark": remark,
        "student_name": student_name,
        "course_code": course_code,
        "marks": marks,
        "grade": grade,
    }
