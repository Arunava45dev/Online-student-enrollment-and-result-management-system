import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import Loader from "../../components/Loader";
import StatusStamp from "../../components/StatusStamp";
import { listAllEnrollments, cancelEnrollment } from "../../api/enrollments";
import { extractErrorMessage } from "../../api/client";
import { ADMIN_NAV } from "./nav";

export default function ManageEnrollments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await listAllEnrollments();
      setRows(res.data || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

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
    <Shell groups={ADMIN_NAV}>
      <p className="page-eyebrow">Ledger</p>
      <h1 className="page-title">Enrollments</h1>
      <p className="page-subtitle">Every student enrollment on file.</p>

      {error && <div className="error-banner">{error}</div>}

      <div className="panel">
        {loading ? (
          <Loader />
        ) : (
          <table className="ledger">
            <thead><tr><th>Student</th><th>Course</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.length === 0 && (
                <tr className="empty-row"><td colSpan={4}>No enrollments recorded yet.</td></tr>
              )}
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.student_name || row.student_id}</td>
                  <td>{row.course_title || row.course_name || row.course_id}</td>
                  <td><StatusStamp value={row.status || "enrolled"} /></td>
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
