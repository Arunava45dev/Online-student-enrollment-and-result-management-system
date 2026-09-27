import io
import re
from fastapi import APIRouter, Depends, status, HTTPException, Query
from fastapi.responses import StreamingResponse
from bson import ObjectId
from typing import List, Optional

from app.schemas.result import ResultCreate, ResultResponse
from app.routers.auth import get_current_admin, get_current_user
from app.database import db
from app.services.pdf_service import generate_marksheet_pdf

router = APIRouter(prefix="/results", tags=["Results"])


@router.post("/", response_model=ResultResponse, status_code=status.HTTP_201_CREATED)
async def publish_result(result: ResultCreate, admin: dict = Depends(get_current_admin)):
    result_dict = result.model_dump()
    new_result = await db["results"].insert_one(result_dict)
    result_dict["id"] = str(new_result.inserted_id)
    if "_id" in result_dict:
        del result_dict["_id"]
    return result_dict


@router.get("/", response_model=List[ResultResponse])
async def list_results(admin: dict = Depends(get_current_admin)):
    results = await db["results"].find().sort("_id", -1).to_list(200)
    return [{
        "id": str(r["_id"]),
        "roll_number": str(r.get("roll_number", "")),
        "subject_code": str(r.get("subject_code", "")),
        "marks": float(r.get("marks", 0)),
        "grade": str(r.get("grade", "N/A")),
        "semester": int(r.get("semester", 1)),
    } for r in results]


@router.delete("/{result_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_result(result_id: str, admin: dict = Depends(get_current_admin)):
    if not ObjectId.is_valid(result_id):
        raise HTTPException(status_code=400, detail="Invalid result ID")
    deleted = await db["results"].delete_one({"_id": ObjectId(result_id)})
    if not deleted.deleted_count:
        raise HTTPException(status_code=404, detail="Result not found")


@router.get("/my-results", response_model=List[ResultResponse])
async def get_my_results(semester: Optional[int] = None, current_user: dict = Depends(get_current_user)):
    if semester is not None and not 1 <= semester <= 8:
        raise HTTPException(status_code=400, detail="Semester must be between 1 and 8")
    user_email = current_user.get("email", "")
    user_id = str(current_user["_id"])

    # Attempt to locate roll number via student registry
    student_record = None
    if user_email:
        student_record = await db["students"].find_one(
            {"email": {"$regex": f"^{re.escape(user_email)}$", "$options": "i"}}
        )

    queries = [{"student_id": user_id}]
    if student_record and "roll_number" in student_record:
        queries.append({"roll_number": student_record["roll_number"]})

    query = {"$or": queries}
    if semester is not None:
        query["$and"] = ([{"$or": queries}, {"$or": [{"semester": 1}, {"semester": {"$exists": False}}]}]
                         if semester == 1 else [{"$or": queries}, {"semester": semester}])
        del query["$or"]
    results = await db["results"].find(query).sort("_id", -1).to_list(200)

    formatted = []
    for r in results:
        formatted.append({
            "id": str(r["_id"]),
            "roll_number": str(r.get("roll_number", "")),
            "subject_code": str(r.get("subject_code", "")),
            "marks": float(r.get("marks", 0)),
            "grade": str(r.get("grade", "N/A")),
            "semester": int(r.get("semester", 1)),
        })

    return formatted


@router.get("/marksheet/pdf")
async def download_marksheet_pdf(
    semester: int = Query(1, ge=1, le=8),
    roll_number: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    """
    Generate and stream an official marksheet in PDF format.
    Students can download their own marksheet; Admin/Faculty can specify any student's roll_number.
    """
    user_role = current_user.get("role", "student")
    user_email = current_user.get("email", "")
    user_id = str(current_user["_id"])

    student_doc = None
    target_roll = None

    if user_role in ["admin", "faculty"]:
        if not roll_number or not roll_number.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Roll number is required for administrators/faculty to generate a marksheet.",
            )
        target_roll = roll_number.strip()
        student_doc = await db["students"].find_one(
            {"roll_number": {"$regex": f"^{re.escape(target_roll)}$", "$options": "i"}}
        )
    else:
        # Student user: resolve roll number from student registry or user info
        if user_email:
            student_doc = await db["students"].find_one(
                {"email": {"$regex": f"^{re.escape(user_email)}$", "$options": "i"}}
            )
        if student_doc and student_doc.get("roll_number"):
            target_roll = student_doc["roll_number"]
        elif roll_number and roll_number.strip():
            target_roll = roll_number.strip()
        else:
            target_roll = user_id

    # Build queries for results
    queries = []
    if target_roll:
        queries.append({"roll_number": {"$regex": f"^{re.escape(target_roll)}$", "$options": "i"}})
    if user_role == "student":
        queries.append({"student_id": user_id})

    if not queries:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found. Please contact administration.",
        )

    sem_filter = [{"semester": 1}, {"semester": {"$exists": False}}] if semester == 1 else [{"semester": semester}]
    query = {
        "$and": [
            {"$or": queries},
            {"$or": sem_filter},
        ]
    }

    raw_results = await db["results"].find(query).sort("subject_code", 1).to_list(200)

    if not raw_results:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No published results found for Semester {semester}."
        )

    # Fetch courses to get descriptive titles and credit hours
    subject_codes = [r.get("subject_code") for r in raw_results if r.get("subject_code")]
    course_map = {}
    if subject_codes:
        courses = await db["courses"].find({"code": {"$in": subject_codes}}).to_list(100)
        for c in courses:
            code_key = str(c.get("code", "")).strip().upper()
            course_map[code_key] = c

    results_data = []
    for r in raw_results:
        code = str(r.get("subject_code", "")).strip().upper()
        c_info = course_map.get(code, {})
        title = c_info.get("title", c_info.get("name", code))
        credits = c_info.get("credits", 4)
        results_data.append({
            "subject_code": code,
            "course_title": title,
            "credits": credits,
            "max_marks": 100,
            "marks": float(r.get("marks", 0)),
            "grade": str(r.get("grade", "N/A")),
        })

    # Prepare student info
    disp_name = (
        student_doc.get("name")
        if student_doc and student_doc.get("name")
        else current_user.get("name", f"Student ({target_roll})")
    )
    disp_email = (
        student_doc.get("email")
        if student_doc and student_doc.get("email")
        else user_email
    )
    disp_dept = (
        student_doc.get("department", "General")
        if student_doc
        else "General"
    )

    student_info = {
        "name": disp_name,
        "roll_number": target_roll or "N/A",
        "email": disp_email,
        "department": disp_dept,
        "semester": semester,
    }

    # Optional AI performance summary
    summary_text = None
    try:
        from app.config import settings
        if settings.OPENAI_API_KEY:
            from app.services.openai_service import generate_result_summary
            summary_text = await generate_result_summary(
                disp_name,
                [{"course_name": r["subject_code"], "marks": r["marks"], "grade": r["grade"]} for r in results_data]
            )
    except Exception:
        summary_text = None

    pdf_bytes = generate_marksheet_pdf(
        student_info=student_info,
        results=results_data,
        summary_text=summary_text,
    )

    safe_roll = re.sub(r"[^a-zA-Z0-9_-]", "_", str(student_info["roll_number"]))
    filename = f"Marksheet_Sem{semester}_{safe_roll}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )

