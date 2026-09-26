# Online Student Enrollment & Result Management System

A full-stack EdTech application for course enrollment, examination results, notices, and role-based administration.

## Features

- Student course catalog, enrollment tracking, results, notices, and AI assistant
- Admin and faculty dashboards for courses, students, enrollments, exams, results, and notices
- Role-protected FastAPI endpoints with JWT authentication
- Responsive React UI with modern dark/light themes
- Student registry deletion for admin and faculty users

## Tech stack

- Frontend: React, Vite, React Router, Axios, Lucide
- Backend: FastAPI, Motor, MongoDB, JWT authentication

## Run locally

### Backend

```powershell
cd backend
Copy-Item .env.example .env
..\backend\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Set the required values in `backend/.env` before starting the API. Never commit this file.

### Frontend

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

The frontend starts at `http://localhost:5173` and uses `http://127.0.0.1:8000` by default for the API.

## Environment variables

`backend/.env` requires values such as:

```env
MONGO_URI=your_mongodb_connection_string
DB_NAME=enrollment_db
JWT_SECRET=use_a_long_random_secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=120
OPENAI_API_KEY=your_api_key
FRONTEND_ORIGIN=http://localhost:5173
```

See [backend/.env.example](backend/.env.example) for the complete safe template.

## Production build

```powershell
cd frontend
npm run build
```
