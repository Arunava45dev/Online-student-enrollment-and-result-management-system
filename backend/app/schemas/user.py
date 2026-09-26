from pydantic import BaseModel, EmailStr, Field
from enum import Enum

class Role(str, Enum):
    student="student"
    faculty="faculty"
    admin="admin"

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)
    role: Role = Role.student

# Backward compatibility alias
UserResister = UserRegister

class UserLogin(BaseModel):
    email:EmailStr
    password:str

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    email: EmailStr
    otp: str = Field(pattern=r"^\d{6}$")
    password: str = Field(min_length=6)

class UserOut(BaseModel):
    id:str
    name:str
    email:EmailStr
    role:Role

class Token(BaseModel):
    access_token:str
    token_type:str="bearer"
    user:UserOut
