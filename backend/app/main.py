from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Routers Import
from app.routers import (
    ai,
    auth,
    courses,
    enrollment,
    exams,
    notices,
    results,
    students,
)

app = FastAPI(
    title="Student Enrollment and Result Management System",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication Router Sabse Upar Register Karein
app.include_router(auth.router)

# Baaki Routers
app.include_router(courses.router)
app.include_router(enrollment.router)
app.include_router(results.router)
app.include_router(students.router)
app.include_router(exams.router)
app.include_router(notices.router)
app.include_router(ai.router)


@app.get("/")
async def root():
    return {"status": "ok"}