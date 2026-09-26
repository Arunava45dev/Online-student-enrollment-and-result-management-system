import re
from fastapi import APIRouter, Depends, status, HTTPException
from bson import ObjectId
from typing import List, Optional

from app.schemas.result import ResultCreate, ResultResponse
from app.routers.auth import get_current_admin, get_current_user
from app.database import db

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
