from pydantic import BaseModel, Field
from typing import Optional

class CourseCreate(BaseModel):
    code: str
    title: str
    credits: int = Field(gt=0, le=10)
    description: Optional[str] = None
    semester: int = Field(ge=1, le=8)

class CourseOut(BaseModel):
    id: str
    code: str
    title: str
    credits: int
    description: Optional[str] = None
    semester: int
