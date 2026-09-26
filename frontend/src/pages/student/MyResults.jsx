import { useEffect, useState } from "react";
import { Award, Sparkles, BookOpen } from "lucide-react";
import Shell from "../../components/Shell";
import Loader from "../../components/Loader";
import StatusStamp from "../../components/StatusStamp";
import { getResultSummary } from "../../api/ai";
import { getMyResults } from "../../api/results";
import { extractErrorMessage } from "../../api/client";
import { STUDENT_NAV } from "./nav";
import { SEMESTERS, semesterLabel } from "../../constants/semesters";

export default function MyResults() {
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
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

  return (
    <Shell groups={STUDENT_NAV}>
      <p className="page-eyebrow">Academic Records</p>
      <h1 className="page-title">My results</h1>
      <p className="page-subtitle">Your published examination marks for each semester.</p>

      <div className="field" style={{ maxWidth: 240 }}>
        <label htmlFor="semester">Semester</label>
        <select id="semester" value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
          {SEMESTERS.map((item) => <option key={item} value={item}>{semesterLabel(item)}</option>)}
        </select>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-2">
        {/* Left Column: Official Published Results Table */}
        <div className="panel section-gap">
          <div className="panel-header">
            <h2><Award size={16} /> {semesterLabel(semester)} marksheet</h2>
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
