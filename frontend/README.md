# Registrar — Student Enrollment & Result Management (Frontend)

React + Vite frontend for the FastAPI backend shown in `/docs`
(Swagger UI at `http://127.0.0.1:8000/docs`).

## Run it

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. Backend base URL is set in `.env`:

```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Change this if your FastAPI server runs elsewhere. Make sure CORS is
enabled on the backend for `http://localhost:5173`, e.g.:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Structure

- `src/api/` — one file per endpoint group (`auth`, `courses`,
  `enrollments`, `students`, `exams`, `results`, `notices`, `ai`),
  matching the tags in your Swagger docs.
- `src/context/AuthContext.jsx` — login/register/logout, JWT storage,
  role resolution.
- `src/pages/student/` — course catalog, my enrollments, result
  summary (via `/ai/summary`), notices, AI chat.
- `src/pages/admin/` — manage courses, students, enrollments, exams,
  publish results, notices, AI remark.
- Role-based routing: `/student/*` vs `/admin/*`, guarded by
  `ProtectedRoute`.

## Things you'll likely need to adjust

The Swagger screenshot showed endpoint paths and schema **names**,
but not the expanded field lists inside each schema. So a few field
names in `src/api/*.js` and the page forms are **best-guess
assumptions** — check `/docs` → Schemas → (expand each) and adjust:

- **Login** (`Body_login_auth_login_post`): assumed to be FastAPI's
  default `OAuth2PasswordRequestForm` (form-encoded `username` +
  `password`). If your backend instead expects JSON `{ email,
  password }`, update `loginUser()` in `src/api/auth.js`.
- **Role after login**: the app tries `response.data.role`,
  `response.data.user.role`, then a `role` claim inside the JWT, and
  finally falls back to whichever role the user picked on the login
  screen (Student / Admin toggle). If your login response returns
  the role differently, update `login()` in `AuthContext.jsx`.
- **`UserRegister`**: assumed `{ name, email, password, role }`.
- **`CourseCreate` / `CourseOut`**: assumed `{ code, title, credits,
  description }` / adds `id`.
- **`StudentCreate`**: assumed `{ name, email, roll_no }`.
- **`ExamCreate`**: assumed `{ course_id, title, date }`.
- **`ResultCreate`**: assumed `{ student_id, exam_id, marks, grade }`.
- **`NoticeCreate`**: assumed `{ title, content }`.
- **`GET /notices/`**: not visible in the screenshot (only `POST` was
  captured) — the frontend assumes it exists for listing. Remove
  `listNotices()` calls if it doesn't.
- **`ChatRequest` / `ChatResponse`**: assumed `{ message, history }`
  → `{ reply }`.
- **`RemarkRequest` / `RemarkResponse`**: assumed `{ student_id,
  context }` → `{ remark }`.
- **`SummaryResponse`**: assumed `{ summary }` (used on the student
  Result Summary page, via `GET /ai/summary`).

All of these are isolated to `src/api/*.js` and a couple of form
components, so fixing a mismatched field name is a one-line change.

## Design

Ledger/registrar visual theme — warm paper background, serif display
type (Fraunces) for headings, monospace (IBM Plex Mono) for IDs and
data, rubber-stamp-style status badges for enrollment/result states.
