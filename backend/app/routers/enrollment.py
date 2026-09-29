from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from bson import ObjectId
from datetime import datetime
from typing import List
import io

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.graphics.shapes import Drawing, Rect
from reportlab.graphics import renderPDF

from app.database import enrollments_collection, courses_collection, users_collection
from app.schemas.enrollment import EnrollRequest, EnrollmentOut
from app.auth import get_current_user, require_role

router = APIRouter(prefix="/enrollments", tags=["Enrollments"])


async def enrollment_helper(en) -> dict:
    course = None
    if ObjectId.is_valid(en.get("course_id", "")):
        course = await courses_collection.find_one({"_id": ObjectId(en["course_id"])})

    student = None
    if ObjectId.is_valid(en.get("student_id", "")):
        student = await users_collection.find_one({"_id": ObjectId(en["student_id"])})

    course_title = course["title"] if course and "title" in course else None
    return {
        "id": str(en["_id"]),
        "student_id": en["student_id"],
        "student_name": student["name"] if student and "name" in student else None,
        "course_id": en["course_id"],
        "course_name": course_title,
        "course_title": course_title,
        "status": en.get("status", "enrolled"),
        "enrolled_at": en["enrolled_at"].isoformat() if hasattr(en.get("enrolled_at"), "isoformat") else str(en.get("enrolled_at", "")),
        "semester": en.get("semester", course.get("semester", 1) if course else 1),
    }


@router.post("/", response_model=EnrollmentOut, dependencies=[Depends(require_role("student"))])
async def enroll(payload: EnrollRequest, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(payload.course_id):
        raise HTTPException(status_code=400, detail="Invalid course ID")
    course = await courses_collection.find_one({"_id": ObjectId(payload.course_id)})
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    already = await enrollments_collection.find_one({
        "student_id": str(current_user["_id"]),
        "course_id": payload.course_id,
        "semester": course.get("semester", 1),
    })
    if already:
        raise HTTPException(status_code=400, detail="Already enrolled in this course")

    doc = {
        "student_id": str(current_user["_id"]),
        "course_id": payload.course_id,
        "semester": course.get("semester", 1),
        "status": "enrolled",
        "enrolled_at": datetime.utcnow(),
    }
    result = await enrollments_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return await enrollment_helper(doc)




# ──────────────────────────────────────────────────────────────
# PDF generation helpers
# ──────────────────────────────────────────────────────────────

_DARK_NAVY   = colors.HexColor("#0D1B3E")
_ACCENT_TEAL = colors.HexColor("#38F2E0")
_ACCENT_VIOL = colors.HexColor("#8B6BFF")
_LIGHT_ROW   = colors.HexColor("#EEF0F8")
_WHITE       = colors.white
_GREY_TEXT   = colors.HexColor("#6E7891")


def _make_pdf(student: dict, enrollments: list, semester: int | None) -> bytes:
    """Render enrollment data to a PDF and return raw bytes."""
    buf = io.BytesIO()

    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
    )

    styles = getSampleStyleSheet()

    # ── Custom paragraph styles ──────────────────────────────
    h_title = ParagraphStyle(
        "HTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=22,
        textColor=_WHITE,
        spaceAfter=2,
        alignment=TA_CENTER,
    )
    h_sub = ParagraphStyle(
        "HSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        textColor=_ACCENT_TEAL,
        spaceAfter=0,
        alignment=TA_CENTER,
    )
    section_label = ParagraphStyle(
        "SectionLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        textColor=_GREY_TEXT,
        spaceBefore=4,
        spaceAfter=2,
    )
    info_val = ParagraphStyle(
        "InfoVal",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        textColor=_DARK_NAVY,
    )
    info_bold = ParagraphStyle(
        "InfoBold",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        textColor=_DARK_NAVY,
    )
    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        textColor=_GREY_TEXT,
        alignment=TA_CENTER,
    )

    # ── Story ────────────────────────────────────────────────
    story = []
    page_w, _ = A4
    inner_w = page_w - 36 * mm  # left + right margins

    # ── Header banner ────────────────────────────────────────
    header_tbl = Table(
        [[
            Paragraph("STUDENT ENROLLMENT CONFIRMATION", h_title),
            Paragraph("OFFICIAL DOCUMENT", h_sub),
        ]],
        colWidths=[inner_w],
    )
    header_tbl.setStyle(TableStyle([
        ("BACKGROUND",  (0, 0), (-1, -1), _DARK_NAVY),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [_DARK_NAVY]),
        ("BOX",         (0, 0), (-1, -1), 0, _DARK_NAVY),
        ("TOPPADDING",  (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("LEFTPADDING",  (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("VALIGN",      (0, 0), (-1, -1), "MIDDLE"),
        ("SPAN",        (0, 0), (-1, -1)),
    ]))

    # Combine title + subtitle in one cell
    header_tbl = Table(
        [[Paragraph("STUDENT ENROLLMENT CONFIRMATION", h_title)],
         [Paragraph("OFFICIAL DOCUMENT · GENERATED ON " + datetime.utcnow().strftime("%d %B %Y").upper(), h_sub)]],
        colWidths=[inner_w],
    )
    header_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), _DARK_NAVY),
        ("TOPPADDING",    (0, 0), (0, 0),   16),
        ("BOTTOMPADDING", (0, 0), (0, 0),   4),
        ("BOTTOMPADDING", (0, 1), (0, 1),   16),
        ("TOPPADDING",    (0, 1), (0, 1),   0),
        ("LEFTPADDING",   (0, 0), (-1, -1), 12),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 12),
    ]))
    story.append(header_tbl)
    story.append(Spacer(1, 6 * mm))

    # ── Student info section ─────────────────────────────────
    student_name  = student.get("name", "—")
    student_email = student.get("email", "—")
    semester_str  = f"Semester {semester}" if semester else "All Semesters"
    generated_str = datetime.utcnow().strftime("%d %B %Y, %H:%M UTC")

    info_data = [
        [
            Paragraph("STUDENT NAME", section_label),
            Paragraph("EMAIL ADDRESS", section_label),
            Paragraph("SEMESTER", section_label),
            Paragraph("GENERATED AT", section_label),
        ],
        [
            Paragraph(student_name, info_bold),
            Paragraph(student_email, info_val),
            Paragraph(semester_str, info_bold),
            Paragraph(generated_str, info_val),
        ],
    ]
    col_w = inner_w / 4
    info_tbl = Table(info_data, colWidths=[col_w] * 4)
    info_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  colors.HexColor("#F0F2FA")),
        ("BACKGROUND",    (0, 1), (-1, 1),  _WHITE),
        ("BOX",           (0, 0), (-1, -1), 0.5, colors.HexColor("#DDE0EC")),
        ("INNERGRID",     (0, 0), (-1, -1), 0.3, colors.HexColor("#DDE0EC")),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
        ("VALIGN",        (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(info_tbl)
    story.append(Spacer(1, 6 * mm))

    # ── Accent line ──────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=2, color=_ACCENT_TEAL, spaceAfter=4 * mm))

    # ── Course table ─────────────────────────────────────────
    course_header_style = ParagraphStyle(
        "CourseHdr",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        textColor=_WHITE,
    )
    course_row_style = ParagraphStyle(
        "CourseRow",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        textColor=_DARK_NAVY,
    )
    status_style = ParagraphStyle(
        "Status",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        textColor=colors.HexColor("#14C480"),
    )

    col_widths = [
        inner_w * 0.06,   # #
        inner_w * 0.44,   # Course Name
        inner_w * 0.12,   # Semester
        inner_w * 0.18,   # Date
        inner_w * 0.20,   # Status
    ]

    rows = [[
        Paragraph("#",           course_header_style),
        Paragraph("Course Name", course_header_style),
        Paragraph("Semester",    course_header_style),
        Paragraph("Enrolled On", course_header_style),
        Paragraph("Status",      course_header_style),
    ]]

    for idx, en in enumerate(enrollments, 1):
        enrolled_at = ""
        if en.get("enrolled_at"):
            try:
                dt = datetime.fromisoformat(en["enrolled_at"].replace("Z", "+00:00"))
                enrolled_at = dt.strftime("%d %b %Y")
            except Exception:
                enrolled_at = str(en["enrolled_at"])[:10]

        status_text = (en.get("status") or "enrolled").upper()
        status_color = (
            colors.HexColor("#14C480") if status_text == "ENROLLED"
            else colors.HexColor("#FF3B6B")
        )
        status_p = ParagraphStyle(
            f"St{idx}",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            textColor=status_color,
        )

        rows.append([
            Paragraph(str(idx),                                   course_row_style),
            Paragraph(en.get("course_title") or en.get("course_name") or en.get("course_id", "—"), course_row_style),
            Paragraph(str(en.get("semester", "—")),               course_row_style),
            Paragraph(enrolled_at or "—",                         course_row_style),
            Paragraph(status_text,                                 status_p),
        ])

    if not enrollments:
        rows.append([
            Paragraph("—", course_row_style),
            Paragraph("No enrollments found for this semester.", course_row_style),
            Paragraph("—", course_row_style),
            Paragraph("—", course_row_style),
            Paragraph("—", course_row_style),
        ])

    course_tbl = Table(rows, colWidths=col_widths, repeatRows=1)
    row_bg = [_WHITE, _LIGHT_ROW]
    ts = [
        ("BACKGROUND",    (0, 0), (-1, 0),  _DARK_NAVY),
        ("TEXTCOLOR",     (0, 0), (-1, 0),  _WHITE),
        ("TOPPADDING",    (0, 0), (-1, 0),  8),
        ("BOTTOMPADDING", (0, 0), (-1, 0),  8),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 8),
        ("TOPPADDING",    (0, 1), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 7),
        ("BOX",           (0, 0), (-1, -1), 0.5, colors.HexColor("#DDE0EC")),
        ("INNERGRID",     (0, 0), (-1, -1), 0.3, colors.HexColor("#DDE0EC")),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]
    for i in range(1, len(rows)):
        ts.append(("BACKGROUND", (0, i), (-1, i), row_bg[i % 2]))
    course_tbl.setStyle(TableStyle(ts))
    story.append(course_tbl)

    story.append(Spacer(1, 8 * mm))

    # ── Summary row ──────────────────────────────────────────
    summary_style = ParagraphStyle(
        "Summary",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        textColor=_GREY_TEXT,
    )
    total = len(enrollments)
    story.append(Paragraph(
        f"Total courses listed: <b>{total}</b>  ·  This document is auto-generated and does not require a signature.",
        summary_style,
    ))
    story.append(Spacer(1, 6 * mm))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#DDE0EC"), spaceAfter=4 * mm))

    # ── Footer ───────────────────────────────────────────────
    story.append(Paragraph(
        "Student Enrollment & Result Management System  ·  This PDF was generated automatically and is valid without a physical signature.",
        footer_style,
    ))

    doc.build(story)
    buf.seek(0)
    return buf.read()


# ── PDF endpoint ─────────────────────────────────────────────────────────────

@router.get("/me/pdf")
async def download_enrollment_pdf(
    semester: int | None = Query(default=None, ge=1, le=8),
    current_user: dict = Depends(get_current_user),
):
    """Generate and stream a PDF of the current student's enrollments."""
    query: dict = {"student_id": str(current_user["_id"])}
    if semester is not None:
        query["$or"] = (
            [{"semester": 1}, {"semester": {"$exists": False}}]
            if semester == 1
            else [{"semester": semester}]
        )

    docs = await enrollments_collection.find(query).to_list(200)
    enrollments_data = [await enrollment_helper(d) for d in docs]

    student = await users_collection.find_one({"_id": current_user["_id"]})

    pdf_bytes = _make_pdf(student or {}, enrollments_data, semester)

    sem_label = f"_sem{semester}" if semester else ""
    filename = f"enrollment_report{sem_label}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/me", response_model=List[EnrollmentOut])

async def my_enrollments(semester: int | None = None, current_user: dict = Depends(get_current_user)):
    if semester is not None and not 1 <= semester <= 8:
        raise HTTPException(status_code=400, detail="Semester must be between 1 and 8")
    query = {"student_id": str(current_user["_id"])}
    if semester is not None:
        query["$or"] = ([{"semester": 1}, {"semester": {"$exists": False}}]
                         if semester == 1 else [{"semester": semester}])
    docs = await enrollments_collection.find(query).to_list(200)
    return [await enrollment_helper(d) for d in docs]


@router.get("/", response_model=List[EnrollmentOut], dependencies=[Depends(require_role("faculty"))])
async def all_enrollments():
    docs = await enrollments_collection.find().to_list(500)
    return [await enrollment_helper(d) for d in docs]


@router.delete("/{enrollment_id}", dependencies=[Depends(require_role("student", "faculty"))])
async def cancel_enrollment(enrollment_id: str, current_user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(enrollment_id):
        raise HTTPException(status_code=400, detail="Invalid enrollment ID")

    en = await enrollments_collection.find_one({"_id": ObjectId(enrollment_id)})
    if not en:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    if current_user["role"] == "student" and en["student_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not your enrollment")

    await enrollments_collection.delete_one({"_id": ObjectId(enrollment_id)})
    return {"message": "Enrollment cancelled"}
