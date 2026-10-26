import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import Loader from "../../components/Loader";
import { listExams, scheduleExam, deleteExam } from "../../api/exams";
import { listCourses } from "../../api/courses";
import { extractErrorMessage } from "../../api/client";
import { FACULTY_NAV } from "./nav";
import { SEMESTERS, semesterLabel } from "../../constants/semesters";

const EMPTY_FORM = { course_id: "", title: "", date: "", room_number: "" };

export default function ManageExams() {
  const [exams, setExams] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semester, setSemester] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [examResponse, courseResponse] = await Promise.all([listExams(semester), listCourses(semester)]);
      setExams(examResponse.data || []);
      setCourses(courseResponse.data || []);
      setForm((current) => ({ ...current, course_id: "" }));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [semester]);
  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  async function handleSchedule(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await scheduleExam(form);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(exam) {
    if (!window.confirm(`Delete the exam “${exam.title}”?`)) return;
    try {
      await deleteExam(exam.id);
      await load();
    } catch (err) { setError(extractErrorMessage(err)); }
  }

  return (
    <Shell groups={FACULTY_NAV}>
      <p className="page-eyebrow">Examination timetable</p>
      <h1 className="page-title">Semester-wise exams</h1>
      <p className="page-subtitle">Publish the examination timetable for each semester.</p>
      {error && <div className="error-banner">{error}</div>}

      <div className="field" style={{ maxWidth: 260 }}>
        <label htmlFor="exam-semester">Viewing semester</label>
        <select id="exam-semester" value={semester} onChange={(event) => setSemester(Number(event.target.value))}>
          {SEMESTERS.map((item) => <option key={item} value={item}>{semesterLabel(item)}</option>)}
        </select>
      </div>

      <div className="grid-2">
        <div className="panel section-gap">
          <div className="panel-header"><h2>Published timetable</h2></div>
          <div style={{ overflowX: "auto" }}>
            {loading ? <Loader /> : <table className="ledger">
              <thead><tr><th>Course</th><th>Examination</th><th>Date & time</th><th>Room</th><th>Actions</th></tr></thead>
              <tbody>
                {exams.length === 0 && <tr className="empty-row"><td colSpan={5}>No exams scheduled for {semesterLabel(semester)} yet.</td></tr>}
                {exams.map((exam) => <tr key={exam.id}>
                  <td><strong>{exam.course_code || "Course"}</strong><br /><span className="muted">{exam.course_title || exam.course_id}</span></td>
                  <td>{exam.title}</td><td className="muted">{exam.date ? new Date(exam.date).toLocaleString() : "—"}</td>
                  <td>{exam.room_number || "TBA"}</td>
                  <td><button className="btn btn-sm btn-danger" type="button" onClick={() => handleDelete(exam)}>Delete</button></td>
                </tr>)}
              </tbody>
            </table>}
          </div>
        </div>

        <div className="panel section-gap">
          <div className="panel-header"><h2>Publish timetable entry</h2></div>
          <div className="panel-body"><form onSubmit={handleSchedule}>
            <div className="field"><label htmlFor="ex-course">Course ({semesterLabel(semester)})</label>
              <select id="ex-course" value={form.course_id} onChange={(event) => update("course_id", event.target.value)} required disabled={!courses.length}>
                <option value="">{courses.length ? "Select a course" : "No courses in this semester"}</option>
                {courses.map((course) => <option key={course.id} value={course.id}>{course.code} — {course.title}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="ex-title">Exam title</label><input id="ex-title" value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="e.g. End Semester Examination" required /></div>
            <div className="field"><label htmlFor="ex-date">Date & time</label><input id="ex-date" type="datetime-local" value={form.date} onChange={(event) => update("date", event.target.value)} required /></div>
            <div className="field"><label htmlFor="ex-room">Room / venue</label><input id="ex-room" value={form.room_number} onChange={(event) => update("room_number", event.target.value)} placeholder="e.g. Hall A-204" /></div>
            <button className="btn btn-block" type="submit" disabled={saving || !courses.length}>{saving ? "Publishing…" : "Publish timetable"}</button>
          </form></div>
        </div>
      </div>
    </Shell>
  );
}
