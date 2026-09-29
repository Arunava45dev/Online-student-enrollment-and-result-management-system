import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import Loader from "../../components/Loader";
import StatusStamp from "../../components/StatusStamp";
import { myEnrollments, cancelEnrollment, downloadEnrollmentPDF } from "../../api/enrollments";
import { extractErrorMessage } from "../../api/client";
import { STUDENT_NAV } from "./nav";
import { SEMESTERS, semesterLabel } from "../../constants/semesters";

export default function MyEnrollments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [semester, setSemester] = useState(1);
  const [downloading, setDownloading] = useState(false);

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

  async function handleDownloadPDF() {
    setDownloading(true);
    setError("");
    try {
      await downloadEnrollmentPDF(semester);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Shell groups={STUDENT_NAV}>
      <p className="page-eyebrow">Your Record</p>

      {/* Title row with Download PDF button */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "4px" }}>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>My enrollments</h1>
          <p className="page-subtitle" style={{ marginTop: 4 }}>Courses you're registered for, organized by semester.</p>
        </div>

        <button
          id="btn-download-enrollment-pdf"
          className="btn btn-sm"
          onClick={handleDownloadPDF}
          disabled={downloading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "linear-gradient(135deg, var(--navy, #8B6BFF), var(--seal-brass, #38F2E0))",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius, 10px)",
            padding: "9px 18px",
            fontWeight: 600,
            fontSize: "0.82rem",
            letterSpacing: "0.03em",
            cursor: downloading ? "not-allowed" : "pointer",
            opacity: downloading ? 0.75 : 1,
            transition: "opacity 0.2s, transform 0.15s",
            boxShadow: "0 4px 18px rgba(139,107,255,0.35)",
            flexShrink: 0,
            alignSelf: "flex-start",
            marginTop: "4px",
          }}
          onMouseEnter={e => { if (!downloading) e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
          title={`Download PDF for ${semesterLabel(semester)}`}
        >
          {downloading ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Generating…
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download PDF
            </>
          )}
        </button>
      </div>

      <div className="field" style={{ maxWidth: 240, marginTop: "16px" }}>
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

      {/* Spinner keyframes for the download button */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </Shell>
  );
}
