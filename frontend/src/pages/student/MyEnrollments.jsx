import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import Loader from "../../components/Loader";
import StatusStamp from "../../components/StatusStamp";
import { myEnrollments, cancelEnrollment } from "../../api/enrollments";
import { extractErrorMessage } from "../../api/client";
import { STUDENT_NAV } from "./nav";
import { SEMESTERS, semesterLabel } from "../../constants/semesters";

export default function MyEnrollments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [semester, setSemester] = useState(1);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await myEnrollments(semester);
      setRows(res.data || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [semester]);

  async function handleCancel(id) {
    setCancellingId(id);
    setError("");
    try {
      await cancelEnrollment(id);
      setRows((r) => r.filter((row) => row.id !== id));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <Shell groups={STUDENT_NAV}>
      <p className="page-eyebrow">Your Record</p>
      <h1 className="page-title">My enrollments</h1>
      <p className="page-subtitle">Courses you're registered for, organized by semester.</p>

      <div className="field" style={{ maxWidth: 240 }}>
        <label htmlFor="semester">Semester</label>
        <select id="semester" value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
          {SEMESTERS.map((item) => <option key={item} value={item}>{semesterLabel(item)}</option>)}
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="panel">
        {loading ? (
          <Loader />
        ) : (
          <table className="ledger">
            <thead>
              <tr><th>Course</th><th>Status</th><th>Enrolled</th><th></th></tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr className="empty-row"><td colSpan={4}>You haven't enrolled in any courses yet.</td></tr>
              )}
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.course_title || row.course_name || row.course_id}</td>
                  <td><StatusStamp value={row.status || "enrolled"} /></td>
                  <td className="muted">{row.enrolled_at ? new Date(row.enrolled_at).toLocaleDateString() : "—"}</td>
                  <td>
                    <button className="btn btn-sm btn-outline" disabled={cancellingId === row.id} onClick={() => handleCancel(row.id)}>
                      {cancellingId === row.id ? "Cancelling…" : "Cancel"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  );
}
