from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional

class StudentCreate(BaseModel):
    roll_number: str
    name: str
    email: EmailStr
    department: str = "GENERAL"
    semester: Optional[int] = 1

    @field_validator("department")
    @classmethod
    def validate_department(cls, department: str) -> str:
        valid_departments = {"CSE", "IT", "ME", "ECE", "EE", "CE", "EEE", "AI&DS", "GENERAL"}
        normalized = department.strip().upper()
        if normalized not in valid_departments:
            raise ValueError("Department must be one of: CSE, IT, ME, ECE, EE, CE, EEE, AI&DS, or GENERAL")
        return normalized

class StudentResponse(StudentCreate):
    id: str

    class Config:
        from_attributes = True
