import { useEffect, useState } from "react";
import { Download, FileText, Ticket } from "lucide-react";
import Shell from "../../components/Shell";
import Loader from "../../components/Loader";
import { downloadHallTicket, listMyExams } from "../../api/exams";
import { extractErrorMessage } from "../../api/client";
import { SEMESTERS, semesterLabel } from "../../constants/semesters";
import { STUDENT_NAV } from "./nav";

export default function HallTicket() {
  const [semester, setSemester] = useState(1);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const response = await listMyExams(semester);
        setExams(response.data || []);
      } catch (err) {
        setExams([]);
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [semester]);

  async function handleDownload() {
    setDownloading(true);
    setError("");
    try {
      const response = await downloadHallTicket(semester);
      const url = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `hall_ticket_semester_${semester}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      if (err?.response?.data instanceof Blob) {
        try {
          const payload = JSON.parse(await err.response.data.text());
          setError(payload.detail || "Unable to download the hall ticket.");
        } catch { setError("Unable to download the hall ticket."); }
      } else {
        setError(extractErrorMessage(err));
      }
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Shell groups={STUDENT_NAV}>
      <p className="page-eyebrow">Examination Records</p>
      <h1 className="page-title">Hall ticket</h1>
      <p className="page-subtitle">Download your admit card for scheduled examinations in each semester.</p>

      <div className="panel section-gap">
        <div className="panel-header"><h2><Ticket size={16} /> Semester examination admit card</h2></div>
        <div className="panel-body">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
            <div className="field" style={{ maxWidth: 250, marginBottom: 0 }}>
              <label htmlFor="hall-ticket-semester">Semester</label>
              <select id="hall-ticket-semester" value={semester} onChange={(event) => setSemester(Number(event.target.value))}>
                {SEMESTERS.map((item) => <option key={item} value={item}>{semesterLabel(item)}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" type="button" onClick={handleDownload} disabled={loading || downloading || exams.length === 0}>
              {downloading ? <Loader size={16} /> : <Download size={16} />} {downloading ? "Preparing PDF..." : "Download Hall Ticket (PDF)"}
            </button>
          </div>
          {error && <div className="error-banner">{error}</div>}
          {loading ? <Loader label="Loading examination schedule..." /> : (
            <table className="ledger">
              <thead><tr><th>Examination</th><th>Date & time</th><th>Room</th></tr></thead>
              <tbody>{exams.length === 0 ? <tr className="empty-row"><td colSpan={3}>No scheduled exams for your enrolled courses in this semester.</td></tr> : exams.map((exam) => <tr key={exam.id}><td><strong>{exam.title}</strong></td><td>{new Date(exam.date).toLocaleString()}</td><td>{exam.room_number || "To be announced"}</td></tr>)}</tbody>
            </table>
          )}
          {!loading && exams.length > 0 && <p className="muted" style={{ marginTop: 16 }}><FileText size={14} style={{ verticalAlign: "-2px" }} /> Your PDF includes this complete schedule and student details.</p>}
        </div>
      </div>
    </Shell>
  );
}
