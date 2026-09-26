import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import Loader from "../../components/Loader";
import { deleteResult, listResults, publishResult } from "../../api/results";
import { extractErrorMessage } from "../../api/client";
import { ADMIN_NAV } from "./nav";
import { SEMESTERS, semesterLabel } from "../../constants/semesters";

const EMPTY_FORM = {
  roll_number: "",
  subject_code: "",
  marks: "",
  grade: "",
  semester: "1"
};

export default function PublishResults() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setResults((await listResults()).data || []); }
    catch (err) { setError(extractErrorMessage(err)); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handlePublish(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await publishResult({
        ...form,
        marks: Number(form.marks) || 0,
        semester: Number(form.semester)
      });
      setSuccess("Result published.");
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(result) {
    if (!window.confirm(`Delete the published result for ${result.roll_number}?`)) return;
    setError("");
    try { await deleteResult(result.id); await load(); }
    catch (err) { setError(extractErrorMessage(err)); }
  }

  return (
    <Shell groups={ADMIN_NAV}>
      <p className="page-eyebrow">Results Desk</p>
      <h1 className="page-title">Publish results</h1>
      <p className="page-subtitle">Record marks and grade for a student's exam.</p>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <div className="panel" style={{ maxWidth: 460 }}>
        <div className="panel-header">
          <h2>New result</h2>
        </div>
        <div className="panel-body">
          <form onSubmit={handlePublish}>
            <div className="field">
              <label htmlFor="r-semester">Semester</label>
              <select id="r-semester" value={form.semester} onChange={(e) => update("semester", e.target.value)} required>
                {SEMESTERS.map((semester) => <option key={semester} value={semester}>{semesterLabel(semester)}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="r-student">Student ID / Roll Number</label>
              <input
                id="r-student"
                value={form.roll_number}
                onChange={(e) => update("roll_number", e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="r-exam">Exam ID / Subject Code</label>
              <input
                id="r-exam"
                value={form.subject_code}
                onChange={(e) => update("subject_code", e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="r-marks">Marks</label>
              <input
                id="r-marks"
                type="number"
                value={form.marks}
                onChange={(e) => update("marks", e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="r-grade">Grade</label>
              <input
                id="r-grade"
                value={form.grade}
                onChange={(e) => update("grade", e.target.value)}
                required
              />
            </div>

            <button className="btn btn-block" type="submit" disabled={saving}>
              {saving ? "Publishing..." : "Publish result"}
            </button>
          </form>
        </div>
      </div>
      <div className="panel section-gap" style={{ marginTop: 24 }}>
        <div className="panel-header"><h2>Published results</h2></div>
        <div style={{ overflowX: "auto" }}>
          {loading ? <Loader /> : <table className="ledger"><thead><tr><th>Semester</th><th>Roll number</th><th>Subject</th><th>Marks</th><th>Grade</th><th>Actions</th></tr></thead><tbody>
            {results.length === 0 && <tr className="empty-row"><td colSpan={6}>No results published yet.</td></tr>}
            {results.map((result) => <tr key={result.id}><td>{semesterLabel(result.semester || 1)}</td><td>{result.roll_number}</td><td>{result.subject_code}</td><td>{result.marks}</td><td>{result.grade}</td><td><button className="btn btn-sm btn-danger" type="button" onClick={() => handleDelete(result)}>Delete</button></td></tr>)}
          </tbody></table>}
        </div>
      </div>
    </Shell>
  );
}
