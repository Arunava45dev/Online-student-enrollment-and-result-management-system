from pydantic import BaseModel, Field


class ResultBase(BaseModel):
    roll_number: str
    subject_code: str
    marks: float
    grade: str
    semester: int = Field(ge=1, le=8)


class ResultCreate(ResultBase):
    pass


class ResultResponse(ResultBase):
    id: str

    class Config:
        from_attributes = True
