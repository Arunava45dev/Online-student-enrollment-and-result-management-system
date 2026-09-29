from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, status, HTTPException
from app.routers.auth import get_admin_only
from app.database import db

router = APIRouter(prefix="/notices", tags=["Notices"])


@router.get("/")
async def get_notices():
    notices = await db["notices"].find().sort("_id", -1).to_list(100)
    for n in notices:
        n["id"] = str(n.get("_id", ""))
        if "_id" in n:
            del n["_id"]
    return notices


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_notice(notice: dict, admin: dict = Depends(get_admin_only)):
    doc = dict(notice)
    if "created_at" not in doc or not doc["created_at"]:
        doc["created_at"] = datetime.now(timezone.utc).isoformat()
    if "posted_by" not in doc:
        doc["posted_by"] = admin.get("name", "Admin")

    result = await db["notices"].insert_one(doc)
    doc["id"] = str(result.inserted_id)
    if "_id" in doc:
        del doc["_id"]
    return doc


@router.delete("/{notice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notice(notice_id: str, admin: dict = Depends(get_admin_only)):
    if not ObjectId.is_valid(notice_id):
        raise HTTPException(status_code=400, detail="Invalid notice ID")
    deleted = await db["notices"].delete_one({"_id": ObjectId(notice_id)})
    if not deleted.deleted_count:
        raise HTTPException(status_code=404, detail="Notice not found")
