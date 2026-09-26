from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ExamCreate(BaseModel):
    course_id: str
    title: str
    date: datetime
    room_number: Optional[str] = None

class ExamResponse(ExamCreate):
    id: str

    class Config:
        from_attributes = True