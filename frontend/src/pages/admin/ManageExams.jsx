import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import Loader from "../../components/Loader";
import { listExams, scheduleExam, deleteExam } from "../../api/exams";
import { extractErrorMessage } from "../../api/client";
import { ADMIN_NAV } from "./nav";

const EMPTY_FORM = { course_id: "", title: "", date: "" };

export default function ManageExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await listExams();
      setExams(res.data || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSchedule(e) {
    e.preventDefault();
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
    setError("");
    try { await deleteExam(exam.id); await load(); }
    catch (err) { setError(extractErrorMessage(err)); }
  }

  return (
    <Shell groups={ADMIN_NAV}>
      <p className="page-eyebrow">Schedule</p>
      <h1 className="page-title">Exams</h1>
      <p className="page-subtitle">Schedule exams tied to a course.</p>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-2">
        <div className="panel section-gap">
          <div className="panel-header"><h2>Scheduled exams</h2></div>
          <div style={{ overflowX: "auto" }}>
            {loading ? (
              <Loader />
            ) : (
              <table className="ledger">
                <thead><tr><th>ID</th><th>Course</th><th>Title</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>
                  {exams.length === 0 && (
                    <tr className="empty-row"><td colSpan={5}>No exams scheduled yet.</td></tr>
                  )}
                  {exams.map((ex) => (
                    <tr key={ex.id}>
                      <td>
                        <button
                          className="btn btn-sm btn-outline"
                          type="button"
                          onClick={() => navigator.clipboard.writeText(ex.id)}
                          title={ex.id}
                        >
                          Copy ID
                        </button>
                      </td>
                      <td className="num">{ex.course_id}</td>
                      <td>{ex.title}</td>
                      <td className="muted">{ex.date ? new Date(ex.date).toLocaleDateString() : "—"}</td>
                      <td><button className="btn btn-sm btn-danger" type="button" onClick={() => handleDelete(ex)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="panel section-gap">
          <div className="panel-header"><h2>Schedule exam</h2></div>
          <div className="panel-body">
            <form onSubmit={handleSchedule}>
              <div className="field">
                <label htmlFor="ex-course">Course ID</label>
                <input id="ex-course" value={form.course_id} onChange={(e) => update("course_id", e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="ex-title">Exam title</label>
                <input id="ex-title" value={form.title} onChange={(e) => update("title", e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="ex-date">Date</label>
                <input id="ex-date" type="date" value={form.date} onChange={(e) => update("date", e.target.value)} required />
              </div>
              <button className="btn btn-block" type="submit" disabled={saving}>
                {saving ? "Scheduling…" : "Schedule exam"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Shell>
  );
}
