import { useEffect, useState } from "react";
import { Award, Sparkles, BookOpen, Download, FileText } from "lucide-react";
import Shell from "../../components/Shell";
import Loader from "../../components/Loader";
import StatusStamp from "../../components/StatusStamp";
import { getResultSummary } from "../../api/ai";
import { getMyResults, downloadMarksheetPdf } from "../../api/results";
import { extractErrorMessage } from "../../api/client";
import { STUDENT_NAV } from "./nav";
import { SEMESTERS, semesterLabel } from "../../constants/semesters";

export default function MyResults() {
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [semester, setSemester] = useState(1);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [resSummary, resList] = await Promise.allSettled([
          getResultSummary(semester),
          getMyResults(semester),
        ]);

        if (resSummary.status === "fulfilled") {
          setSummary(resSummary.value.data);
        }
        if (resList.status === "fulfilled") {
          setResults(resList.value.data || []);
        } else if (resSummary.status === "rejected") {
          setError(extractErrorMessage(resSummary.reason));
        }
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [semester]);

  async function handleDownloadPdf() {
    if (results.length === 0) return;
    setDownloading(true);
    setError("");
    try {
      const res = await downloadMarksheetPdf(semester);
      let filename = `Marksheet_Semester_${semester}.pdf`;
      const disposition = res.headers && res.headers["content-disposition"];
      if (disposition && disposition.includes("filename=")) {
        const match = disposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) filename = match[1];
      }
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          setError(json.detail || "Failed to download marksheet PDF.");
        } catch {
          setError("Failed to download marksheet PDF.");
        }
      } else {
        setError(extractErrorMessage(err));
      }
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Shell groups={STUDENT_NAV}>
      <p className="page-eyebrow">Academic Records</p>
      <h1 className="page-title">My results</h1>
      <p className="page-subtitle">Your published examination marks for each semester.</p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
        <div className="field" style={{ maxWidth: 240, marginBottom: 0 }}>
          <label htmlFor="semester">Semester</label>
          <select id="semester" value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
            {SEMESTERS.map((item) => <option key={item} value={item}>{semesterLabel(item)}</option>)}
          </select>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleDownloadPdf}
          disabled={downloading || loading || results.length === 0}
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          title={results.length === 0 ? "No published marksheet available to download" : "Download official PDF marksheet"}
        >
          {downloading ? <Loader size={16} /> : <Download size={16} />}
          {downloading ? "Preparing PDF..." : "Download Marksheet (PDF)"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-2">
        {/* Left Column: Official Published Results Table */}
        <div className="panel section-gap">
          <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2><Award size={16} /> {semesterLabel(semester)} marksheet</h2>
            {results.length > 0 && (
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={handleDownloadPdf}
                disabled={downloading}
                title="Download PDF"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}
              >
                <FileText size={14} /> {downloading ? "Generating..." : "PDF Marksheet"}
              </button>
            )}
          </div>
          <div style={{ overflowX: "auto" }}>
            {loading ? (
              <Loader label="Loading results…" />
            ) : (
              <table className="ledger">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Marks</th>
                    <th>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {results.length === 0 ? (
                    <tr className="empty-row">
                      <td colSpan={3}>No published results on record yet.</td>
                    </tr>
                  ) : (
                    results.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <strong>{r.subject_code}</strong>
                        </td>
                        <td className="num">{r.marks}</td>
                        <td>
                          <StatusStamp value={r.grade} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: AI Academic Summary */}
        <div className="panel section-gap">
          <div className="panel-header">
            <h2><Sparkles size={16} /> AI Academic Summary</h2>
          </div>
          <div className="panel-body">
            {loading ? (
              <Loader label="Compiling summary…" />
            ) : summary?.summary ? (
              <div
                style={{
                  padding: "16px 18px",
                  borderRadius: "var(--radius)",
                  background: "rgba(139, 107, 255, 0.05)",
                  border: "1px solid rgba(139, 107, 255, 0.2)",
                  lineHeight: 1.65,
                  fontSize: 14,
                }}
              >
                {summary.summary}
              </div>
            ) : (
              !error && <p className="muted">No summary available yet. Results must be published first.</p>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

