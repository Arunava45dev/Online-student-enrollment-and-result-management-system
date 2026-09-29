from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.database import exams_collection
from app.schemas.exam import ExamCreate, ExamResponse
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/exams", tags=["Exams"])


def exam_helper(e) -> dict:
    return {
        "id": str(e["_id"]),
        "course_id": e["course_id"],
        "title": e["title"],
        "date": e["date"],
        "room_number": e.get("room_number"),
    }


@router.post("/", response_model=ExamResponse, dependencies=[Depends(require_role("faculty"))])
async def schedule_exam(payload: ExamCreate):
    doc = payload.model_dump()
    result = await exams_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return exam_helper(doc)


@router.get("/", response_model=List[ExamResponse])
async def list_exams(current_user: dict = Depends(require_role("faculty"))):
    docs = await exams_collection.find().to_list(200)
    return [exam_helper(d) for d in docs]


@router.delete("/{exam_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_role("faculty"))])
async def delete_exam(exam_id: str):
    if not ObjectId.is_valid(exam_id):
        raise HTTPException(status_code=400, detail="Invalid exam ID")
    deleted = await exams_collection.delete_one({"_id": ObjectId(exam_id)})
    if not deleted.deleted_count:
        raise HTTPException(status_code=404, detail="Exam not found")
