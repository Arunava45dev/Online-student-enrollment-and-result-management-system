from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class NoticeCreate(BaseModel):
    title: str
    content: str
    posted_by: Optional[str] = "Admin"  # Admin / Teacher
    target_audience: Optional[str] = "all"  # e.g., "all", "CSE", "Semester 4"

class NoticeResponse(NoticeCreate):
    id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True