from pydantic import BaseModel
from typing import List, Literal, Optional

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage]=[]

class ChatResponse(BaseModel):
    reply: str

class SummaryResponse(BaseModel):
    summary: str

class RemarkRequest(BaseModel):
    student_id: str
    course_id: Optional[str] = None
    context: Optional[str] = None

class RemarkResponse(BaseModel):
    remark: str
    student_name: Optional[str] = None
    course_code: Optional[str] = None
    marks: Optional[float] = None
    grade: Optional[str] = None