from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from bson import ObjectId

from app.database import students_collection
from app.schemas.student import StudentCreate, StudentResponse
from app.auth import require_role

router = APIRouter(prefix="/students", tags=["Students"])


def student_helper(s) -> dict:
    return {
        "id": str(s["_id"]),
        "roll_number": s["roll_number"],
        "name": s["name"],
        "email": s["email"],
        "department": s.get("department", "General"),
        "semester": s.get("semester", 1),
    }


@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role("admin"))])
async def create_student(student: StudentCreate):
    existing = await students_collection.find_one({"roll_number": student.roll_number})
    if existing:
        raise HTTPException(status_code=400, detail="Roll number already exists")

    doc = student.model_dump()
    result = await students_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return student_helper(doc)


@router.get("/", response_model=List[StudentResponse], dependencies=[Depends(require_role("admin"))])
async def list_students(department: Optional[str] = None):
    normalized_department = department.strip().upper() if department else None
    query = (
        {"department": {"$in": ["GENERAL", "General"]}}
        if normalized_department == "GENERAL"
        else ({"department": normalized_department} if normalized_department else {})
    )
    docs = await students_collection.find(query).to_list(500)
    return [student_helper(d) for d in docs]


@router.delete("/{student_id}", dependencies=[Depends(require_role("admin"))])
async def delete_student(student_id: str):
    """Remove a registry record without affecting login accounts or results."""
    if not ObjectId.is_valid(student_id):
        raise HTTPException(status_code=400, detail="Invalid student ID")

    deleted = await students_collection.delete_one({"_id": ObjectId(student_id)})
    if not deleted.deleted_count:
        raise HTTPException(status_code=404, detail="Student record not found")
    return {"message": "Student record deleted"}
