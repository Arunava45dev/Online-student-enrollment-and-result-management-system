import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import Shell from "../../components/Shell";
import Loader from "../../components/Loader";
import StatusStamp from "../../components/StatusStamp";
import { listAllEnrollments, cancelEnrollment, downloadFacultyEnrollmentPDF } from "../../api/enrollments";
import { extractErrorMessage } from "../../api/client";
import { FACULTY_NAV } from "./nav";
import { SEMESTERS, semesterLabel } from "../../constants/semesters";

export default function ManageEnrollments() {
  const [rows, setRows] = useState([]);
  const [semester, setSemester] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [downloading, setDownloading] = useState(false);

  async function load() {
    setLoading(true); setError("");
    try { const res = await listAllEnrollments(semester); setRows(res.data || []); }
    catch (err) { setError(extractErrorMessage(err)); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [semester]);

  async function handleCancel(id) {
    setCancellingId(id); setError("");
    try { await cancelEnrollment(id); setRows((items) => items.filter((item) => item.id !== id)); }
    catch (err) { setError(extractErrorMessage(err)); }
    finally { setCancellingId(null); }
  }
  async function handleDownload() {
    setDownloading(true); setError("");
    try { await downloadFacultyEnrollmentPDF(semester); }
    catch (err) { setError(extractErrorMessage(err)); }
    finally { setDownloading(false); }
  }

  return <Shell groups={FACULTY_NAV}>
    <p className="page-eyebrow">Enrollment register</p>
    <h1 className="page-title">Semester-wise enrollments</h1>
    <p className="page-subtitle">Review enrolled students and download the official course register.</p>
    {error && <div className="error-banner">{error}</div>}
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
      <div className="field" style={{ maxWidth: 260, marginBottom: 0 }}><label htmlFor="enrollment-semester">Semester</label>
        <select id="enrollment-semester" value={semester} onChange={(event) => setSemester(Number(event.target.value))}>{SEMESTERS.map((item) => <option key={item} value={item}>{semesterLabel(item)}</option>)}</select>
      </div>
      <button className="btn" type="button" onClick={handleDownload} disabled={downloading}><Download size={16} /> {downloading ? "Preparing PDF…" : "Download enrollment PDF"}</button>
    </div>
    <div className="panel">{loading ? <Loader /> : <div style={{ overflowX: "auto" }}><table className="ledger">
      <thead><tr><th>Student</th><th>Course</th><th>Enrolled on</th><th>Status</th><th></th></tr></thead>
      <tbody>{rows.length === 0 && <tr className="empty-row"><td colSpan={5}>No enrollments recorded for {semesterLabel(semester)} yet.</td></tr>}
        {rows.map((row) => <tr key={row.id}><td>{row.student_name || row.student_id}</td><td>{row.course_title || row.course_name || row.course_id}</td><td className="muted">{row.enrolled_at ? new Date(row.enrolled_at).toLocaleDateString() : "—"}</td><td><StatusStamp value={row.status || "enrolled"} /></td><td><button className="btn btn-sm btn-outline" disabled={cancellingId === row.id} onClick={() => handleCancel(row.id)}>{cancellingId === row.id ? "Cancelling…" : "Cancel"}</button></td></tr>)}
      </tbody>
    </table></div>}</div>
  </Shell>;
}
