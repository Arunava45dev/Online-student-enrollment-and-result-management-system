from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ExamCreate(BaseModel):
    course_id: str
    title: str
    date: datetime
    room_number: Optional[str] = None

class ExamResponse(ExamCreate):
    id: str
    semester: int = Field(ge=1, le=8)
    course_code: Optional[str] = None
    course_title: Optional[str] = None

    class Config:
        from_attributes = True
