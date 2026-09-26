from pydantic import BaseModel
from typing import Optional

class EnrollRequest(BaseModel):
    course_id: str
    student_id: Optional[str]=None
class EnrollmentOut(BaseModel):
    id: str
    student_id: str
    student_name: Optional[str] = None
    course_id: str
    course_name: Optional[str] = None
    course_title: Optional[str] = None
    status: str
    enrolled_at: str
    semester: int
