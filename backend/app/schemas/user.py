from pydantic import BaseModel, EmailStr, Field, field_validator
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

    @field_validator("password")
    @classmethod
    def password_must_fit_bcrypt(cls, password: str) -> str:
        if len(password.encode("utf-8")) > 72:
            raise ValueError("Password must be 72 bytes or fewer. Please use a shorter password.")
        return password

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

    @field_validator("password")
    @classmethod
    def password_must_fit_bcrypt(cls, password: str) -> str:
        if len(password.encode("utf-8")) > 72:
            raise ValueError("Password must be 72 bytes or fewer. Please use a shorter password.")
        return password

class UserOut(BaseModel):
    id:str
    name:str
    email:EmailStr
    role:Role

class Token(BaseModel):
    access_token:str
    token_type:str="bearer"
    user:UserOut
