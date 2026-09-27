import io
from datetime import datetime
from typing import List, Dict, Any, Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)

GRADE_POINTS = {
    "O": 10.0,
    "A+": 9.0,
    "A": 8.0,
    "B+": 7.0,
    "B": 6.0,
    "C": 5.0,
    "P": 4.0,
    "F": 0.0,
}

def _calculate_grade_point(grade: str, marks: float) -> float:
    cleaned = grade.strip().upper() if grade else ""
    if cleaned in GRADE_POINTS:
        return GRADE_POINTS[cleaned]
    # Fallback to standard marks threshold
    if marks >= 90:
        return 10.0
    elif marks >= 80:
        return 9.0
    elif marks >= 70:
        return 8.0
    elif marks >= 60:
        return 7.0
    elif marks >= 50:
        return 6.0
    elif marks >= 40:
        return 5.0
    return 0.0


def generate_marksheet_pdf(
    student_info: Dict[str, Any],
    results: List[Dict[str, Any]],
    summary_text: Optional[str] = None,
) -> bytes:
    """
    Generates a professional, print-ready PDF marksheet in memory.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    # Custom styles
    inst_title_style = ParagraphStyle(
        "InstTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        alignment=1, # Center
        textColor=colors.HexColor("#0F172A"),
    )
    inst_sub_style = ParagraphStyle(
        "InstSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=13,
        alignment=1,
        textColor=colors.HexColor("#475569"),
    )
    doc_heading_style = ParagraphStyle(
        "DocHeading",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        alignment=1,
        textColor=colors.HexColor("#1E3A8A"),
    )
    field_label_style = ParagraphStyle(
        "FieldLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        leading=11,
        textColor=colors.HexColor("#334155"),
    )
    field_value_style = ParagraphStyle(
        "FieldValue",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=11,
        textColor=colors.HexColor("#0F172A"),
    )
    th_style = ParagraphStyle(
        "TableHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=10,
        alignment=1,
        textColor=colors.white,
    )
    td_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1E293B"),
    )
    td_center_style = ParagraphStyle(
        "TableCellCenter",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=11,
        alignment=1,
        textColor=colors.HexColor("#1E293B"),
    )
    td_bold_center = ParagraphStyle(
        "TableCellBoldCenter",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        alignment=1,
        textColor=colors.HexColor("#1E293B"),
    )
    pass_style = ParagraphStyle(
        "PassStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        alignment=1,
        textColor=colors.HexColor("#15803D"),
    )
    fail_style = ParagraphStyle(
        "FailStyle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        alignment=1,
        textColor=colors.HexColor("#B91C1C"),
    )
    summary_body_style = ParagraphStyle(
        "SummaryBody",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#334155"),
    )
    legend_style = ParagraphStyle(
        "LegendStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7,
        leading=9,
        textColor=colors.HexColor("#64748B"),
        alignment=1,
    )
    footer_note_style = ParagraphStyle(
        "FooterNote",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#64748B"),
        alignment=1,
    )

    story = []

    # 1. Header Section
    story.append(Paragraph("STUDENT ENROLLMENT & RESULT MANAGEMENT SYSTEM", inst_title_style))
    story.append(Spacer(1, 3))
    story.append(Paragraph("Office of the Controller of Examinations • Official Grade Report", inst_sub_style))
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#1E3A8A"), spaceBefore=1, spaceAfter=8))

    semester_num = student_info.get("semester", 1)
    story.append(Paragraph(f"SEMESTER {semester_num} OFFICIAL MARKSHEET & TRANSCRIPT", doc_heading_style))
    story.append(Spacer(1, 10))

    # 2. Student Information Box
    issue_date = datetime.now().strftime("%d %B %Y")
    roll_num = str(student_info.get("roll_number", "N/A"))
    doc_ref = f"SER-{datetime.now().strftime('%Y%m')}-{roll_num}-S{semester_num}"

    info_data = [
        [
            Paragraph("Student Name:", field_label_style),
            Paragraph(str(student_info.get("name", "N/A")), field_value_style),
            Paragraph("Roll Number / ID:", field_label_style),
            Paragraph(roll_num, field_value_style),
        ],
        [
            Paragraph("Department:", field_label_style),
            Paragraph(str(student_info.get("department", "General")), field_value_style),
            Paragraph("Academic Semester:", field_label_style),
            Paragraph(f"Semester {semester_num}", field_value_style),
        ],
        [
            Paragraph("Student Email:", field_label_style),
            Paragraph(str(student_info.get("email", "N/A")), field_value_style),
            Paragraph("Date of Issue:", field_label_style),
            Paragraph(issue_date, field_value_style),
        ],
        [
            Paragraph("Document Ref ID:", field_label_style),
            Paragraph(doc_ref, field_value_style),
            Paragraph("Result Status:", field_label_style),
            Paragraph("Official Published", field_value_style),
        ],
    ]

    info_table = Table(info_data, colWidths=[105, 160, 115, 143])
    info_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    story.append(info_table)
    story.append(Spacer(1, 14))

    # 3. Marks Ledger Table
    table_headers = [
        Paragraph("#", th_style),
        Paragraph("Subject Code", th_style),
        Paragraph("Subject / Course Name", th_style),
        Paragraph("Credits", th_style),
        Paragraph("Max Marks", th_style),
        Paragraph("Marks Obtained", th_style),
        Paragraph("Grade", th_style),
        Paragraph("Status", th_style),
    ]

    ledger_rows = [table_headers]

    total_credits = 0
    total_obtained = 0.0
    total_max = 0
    total_weighted_points = 0.0
    any_fail = False

    for idx, r in enumerate(results, start=1):
        subj_code = str(r.get("subject_code", ""))
        subj_title = str(r.get("course_title", subj_code))
        credits = int(r.get("credits", 4))
        max_marks = int(r.get("max_marks", 100))
        marks = float(r.get("marks", 0))
        grade = str(r.get("grade", "N/A")).upper()

        is_pass = grade != "F" and marks >= 40
        status_para = Paragraph("PASS", pass_style) if is_pass else Paragraph("FAIL", fail_style)
        if not is_pass:
            any_fail = True

        total_credits += credits
        total_obtained += marks
        total_max += max_marks

        gp = _calculate_grade_point(grade, marks)
        total_weighted_points += gp * credits

        ledger_rows.append([
            Paragraph(str(idx), td_center_style),
            Paragraph(subj_code, td_bold_center),
            Paragraph(subj_title, td_style),
            Paragraph(str(credits), td_center_style),
            Paragraph(str(max_marks), td_center_style),
            Paragraph(f"{marks:g}", td_center_style),
            Paragraph(grade, td_bold_center),
            status_para,
        ])

    ledger_table = Table(
        ledger_rows,
        colWidths=[24, 75, 175, 45, 52, 58, 44, 50],
    )

    t_style = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]

    for i in range(1, len(ledger_rows)):
        if i % 2 == 0:
            t_style.append(("BACKGROUND", (0, i), (-1, i), colors.HexColor("#F8FAFC")))

    ledger_table.setStyle(TableStyle(t_style))
    story.append(ledger_table)
    story.append(Spacer(1, 10))

    # 4. Summary Calculation
    sgpa = round(total_weighted_points / total_credits, 2) if total_credits > 0 else 0.0
    percentage = round((total_obtained / total_max) * 100, 1) if total_max > 0 else 0.0

    if any_fail:
        final_result = "REAPPEAR / FAILED"
        result_color = colors.HexColor("#B91C1C")
    elif percentage >= 75:
        final_result = "PASSED - FIRST CLASS WITH DISTINCTION"
        result_color = colors.HexColor("#15803D")
    elif percentage >= 60:
        final_result = "PASSED - FIRST CLASS"
        result_color = colors.HexColor("#15803D")
    elif percentage >= 50:
        final_result = "PASSED - SECOND CLASS"
        result_color = colors.HexColor("#0369A1")
    else:
        final_result = "PASSED - PASS CLASS"
        result_color = colors.HexColor("#0369A1")

    res_style = ParagraphStyle(
        "FinalRes",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=12,
        alignment=1,
        textColor=result_color,
    )

    summary_data = [
        [
            Paragraph("Total Credits", field_label_style),
            Paragraph(str(total_credits), field_value_style),
            Paragraph("Marks Scored", field_label_style),
            Paragraph(f"{total_obtained:g} / {total_max}", field_value_style),
        ],
        [
            Paragraph("Percentage", field_label_style),
            Paragraph(f"{percentage}%", field_value_style),
            Paragraph("Semester GPA (SGPA)", field_label_style),
            Paragraph(f"{sgpa:.2f} / 10.00", field_value_style),
        ],
        [
            Paragraph("Final Result", field_label_style),
            Paragraph(final_result, res_style),
            Paragraph("Overall Evaluation", field_label_style),
            Paragraph("Official Completed", field_value_style),
        ],
    ]

    summary_table = Table(summary_data, colWidths=[115, 140, 135, 133])
    summary_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
            ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#94A3B8")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    story.append(summary_table)
    story.append(Spacer(1, 12))

    # 5. Optional AI Academic Summary / Remarks Box
    if summary_text and summary_text.strip():
        remark_content = [
            [
                Paragraph("<b>Academic Performance Remark & Analysis:</b>", field_label_style)
            ],
            [
                Paragraph(summary_text.strip(), summary_body_style)
            ]
        ]
        remark_table = Table(remark_content, colWidths=[523])
        remark_table.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EFF6FF")),
                ("BOX", (0, 0), (-1, -1), 1, colors.HexColor("#BFDBFE")),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
            ])
        )
        story.append(remark_table)
        story.append(Spacer(1, 10))

    # 6. Grading Scale Legend
    legend_text = (
        "<b>Grading Scale:</b> "
        "O (Outstanding: 90-100%, GP 10) | "
        "A+ (Excellent: 80-89%, GP 9) | "
        "A (Very Good: 70-79%, GP 8) | "
        "B+ (Good: 60-69%, GP 7) | "
        "B (Above Average: 50-59%, GP 6) | "
        "C (Average: 40-49%, GP 5) | "
        "F (Fail: &lt;40%, GP 0)"
    )
    story.append(Paragraph(legend_text, legend_style))
    story.append(Spacer(1, 16))

    # 7. Signatures & Authenticity Footer
    sig_data = [
        [
            Paragraph("Prepared & Checked By<br/><b>Academic Registry</b>", td_center_style),
            Paragraph("Generated electronically on<br/><b>" + datetime.now().strftime("%Y-%m-%d %H:%M UTC") + "</b>", td_center_style),
            Paragraph("Approved & Verified By<br/><b>Controller of Examinations</b>", td_center_style),
        ]
    ]
    sig_table = Table(sig_data, colWidths=[174, 175, 174])
    sig_table.setStyle(
        TableStyle([
            ("LINEABOVE", (0, 0), (0, 0), 1, colors.HexColor("#475569")),
            ("LINEABOVE", (2, 0), (2, 0), 1, colors.HexColor("#475569")),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ])
    )
    story.append(KeepTogether([
        sig_table,
        Spacer(1, 8),
        Paragraph("Note: This document is an electronically verified academic transcript issued by the Student Enrollment & Result Management System.", footer_note_style)
    ]))

    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
