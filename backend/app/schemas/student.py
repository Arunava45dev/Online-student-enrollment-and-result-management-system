from pydantic import BaseModel, EmailStr
from typing import Optional

class StudentCreate(BaseModel):
    roll_number: str
    name: str
    email: EmailStr
    department: Optional[str] = "General"
    semester: Optional[int] = 1

class StudentResponse(StudentCreate):
    id: str

    class Config:
        from_attributes = True