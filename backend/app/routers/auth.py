from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
import hashlib
import hmac
import re
import secrets
import smtplib

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm

from app.database import users_collection
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.config import settings
from app.schemas.user import PasswordResetConfirm, PasswordResetRequest

router = APIRouter(prefix="/auth", tags=["Auth"])


def user_helper(user) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user: dict):
    existing = await users_collection.find_one({"email": user["email"]})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    doc = {
        "name": user["name"],
        "email": user["email"],
        "password": hash_password(user["password"]),
        "role": user.get("role", "student"),
    }
    result = await users_collection.insert_one(doc)
    doc["_id"] = result.inserted_id

    token = create_access_token({"sub": str(doc["_id"]), "role": doc["role"]})
    return {"access_token": token, "token_type": "bearer", "user": user_helper(doc)}


@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await users_collection.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user["_id"]), "role": user["role"]})
    return {"access_token": token, "token_type": "bearer", "user": user_helper(user)}


async def send_reset_email(recipient: str, otp: str) -> None:
    """Send a short-lived password-reset OTP via the configured SMTP server."""
    if not (settings.SMTP_HOST and settings.SMTP_FROM):
        raise RuntimeError("Email delivery is not configured")
    message = EmailMessage()
    message["Subject"] = "Your Registrar password reset code"
    message["From"] = settings.SMTP_FROM
    message["To"] = recipient
    message.set_content(
        f"Your password reset code is: {otp}\n\n"
        f"It expires in {settings.RESET_OTP_EXPIRE_MINUTES} minutes. Do not share this code with anyone."
    )
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.send_message(message)


@router.post("/forgot-password")
async def forgot_password(payload: PasswordResetRequest):
    user = await users_collection.find_one({"email": {"$regex": f"^{re.escape(str(payload.email))}$", "$options": "i"}})
    if user:
        otp = f"{secrets.randbelow(1_000_000):06d}"
        # Mongo's default datetime codec returns naive UTC datetimes.
        expires_at = datetime.utcnow() + timedelta(minutes=settings.RESET_OTP_EXPIRE_MINUTES)
        await users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"password_reset_otp_hash": hashlib.sha256(otp.encode()).hexdigest(), "password_reset_expires_at": expires_at, "password_reset_attempts": 0}},
        )
        try:
            await send_reset_email(user["email"], otp)
        except (RuntimeError, OSError, smtplib.SMTPException) as exc:
            await users_collection.update_one({"_id": user["_id"]}, {"$unset": {"password_reset_otp_hash": "", "password_reset_expires_at": "", "password_reset_attempts": ""}})
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Unable to send the reset email. Please try again later.") from exc
    # Do not reveal whether an email has an account.
    return {"message": "If that email is registered, a password-reset code has been sent."}


@router.post("/reset-password")
async def reset_password(payload: PasswordResetConfirm):
    user = await users_collection.find_one({"email": {"$regex": f"^{re.escape(str(payload.email))}$", "$options": "i"}})
    expires_at = user.get("password_reset_expires_at") if user else None
    otp_hash = user.get("password_reset_otp_hash") if user else None
    attempts = user.get("password_reset_attempts", 0) if user else 0
    if not user or not otp_hash or not expires_at or expires_at < datetime.utcnow() or attempts >= settings.RESET_OTP_MAX_ATTEMPTS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This reset code is invalid or has expired")
    if not hmac.compare_digest(hashlib.sha256(payload.otp.encode()).hexdigest(), otp_hash):
        await users_collection.update_one({"_id": user["_id"]}, {"$inc": {"password_reset_attempts": 1}})
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This reset code is invalid or has expired")
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"password": hash_password(payload.password)}, "$unset": {"password_reset_otp_hash": "", "password_reset_expires_at": "", "password_reset_attempts": ""}},
    )
    return {"message": "Password updated. You can now sign in."}


# Kept for backward-compatibility: notices.py, results.py, etc. import this.
async def get_current_admin(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user.get("role") not in ["admin", "faculty"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin or faculty access required")
    return current_user
