import { useState } from "react";
import { Sparkles, Copy, Check, RotateCcw, Award, BookOpen, User, AlertCircle, FileText } from "lucide-react";
import Shell from "../../components/Shell";
import { generateRemark } from "../../api/ai";
import { extractErrorMessage } from "../../api/client";
import { ADMIN_NAV } from "./nav";

export default function AiRemark() {
  const [studentId, setStudentId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [context, setContext] = useState("");
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerate(e) {
    e.preventDefault();
    if (!studentId.trim()) return;

    setBusy(true);
    setError("");
    setResultData(null);
    setCopied(false);

    try {
      const payload = {
        student_id: studentId.trim(),
        ...(courseId.trim() ? { course_id: courseId.trim() } : {}),
        ...(context.trim() ? { context: context.trim() } : {}),
      };

      const res = await generateRemark(payload);
      if (typeof res.data === "string") {
        setResultData({ remark: res.data });
      } else {
        setResultData(res.data);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function handleReset() {
    setStudentId("");
    setCourseId("");
    setContext("");
    setResultData(null);
    setError("");
    setCopied(false);
  }

  async function handleCopy() {
    if (!resultData?.remark) return;
    try {
      await navigator.clipboard.writeText(resultData.remark);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  }

  return (
    <Shell groups={ADMIN_NAV}>
      <p className="page-eyebrow">Faculty Assistant</p>
      <h1 className="page-title">AI Faculty Remark</h1>
      <p className="page-subtitle">
        Generate personalized, professional remarks for report cards based on published student performance.
      </p>

      {error && (
        <div className="error-banner">
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid-2">
        {/* Left Column: Input Form */}
        <div className="panel section-gap">
          <div className="panel-header">
            <h2>
              <Sparkles size={16} /> Generate Remark
            </h2>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={handleReset}
              disabled={busy || (!studentId && !courseId && !context && !resultData)}
              title="Reset form"
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>

          <div className="panel-body">
            <form onSubmit={handleGenerate}>
              <div className="field">
                <label htmlFor="ar-student">Student Roll Number / ID</label>
                <input
                  id="ar-student"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. CS2024001 or MongoDB student ID"
                  required
                />
                <small style={{ display: "block", marginTop: 4, color: "var(--ink-faint)", fontSize: 11 }}>
                  Roll number from published results or student registry ID.
                </small>
              </div>

              <div className="field">
                <label htmlFor="ar-course">Course / Subject Code (optional)</label>
                <input
                  id="ar-course"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  placeholder="e.g. CS101 (leave blank for latest result)"
                />
              </div>

              <div className="field">
                <label htmlFor="ar-context">Faculty Context / Notes (optional)</label>
                <textarea
                  id="ar-context"
                  rows={3}
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g. Great improvement since midterms; excellent lab engagement, but needs more focus in theory exams."
                />
              </div>

              <button className="btn btn-block" type="submit" disabled={busy || !studentId.trim()}>
                <Sparkles size={15} />
                {busy ? "Analyzing results & drafting remark…" : "Generate remark"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Generated Result */}
        <div className="panel section-gap">
          <div className="panel-header">
            <h2>
              <FileText size={16} /> Remark Preview
            </h2>
            {resultData?.remark && (
              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={handleCopy}
                style={{
                  borderColor: copied ? "var(--pass-green)" : undefined,
                  color: copied ? "var(--pass-green)" : undefined,
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied!" : "Copy remark"}
              </button>
            )}
          </div>

          <div className="panel-body">
            {resultData?.remark ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Result Metadata Strip */}
                {(resultData.student_name || resultData.course_code || resultData.grade) && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      padding: "10px 14px",
                      borderRadius: "var(--radius)",
                      background: "rgba(255, 255, 255, 0.03)",
                      border: "1px solid var(--rule-strong)",
                      fontSize: 12,
                    }}
                  >
                    {resultData.student_name && (
                      <span className="user-chip" style={{ fontSize: 11, padding: "3px 9px" }}>
                        <User size={12} style={{ color: "var(--seal-brass)" }} />
                        <strong>{resultData.student_name}</strong>
                      </span>
                    )}
                    {resultData.course_code && (
                      <span className="user-chip" style={{ fontSize: 11, padding: "3px 9px" }}>
                        <BookOpen size={12} style={{ color: "var(--navy)" }} />
                        <span>Course: <strong>{resultData.course_code}</strong></span>
                      </span>
                    )}
                    {resultData.marks !== undefined && resultData.grade && (
                      <span className="stamp stamp-pass" style={{ fontSize: 10 }}>
                        <Award size={11} /> {resultData.marks} marks ({resultData.grade})
                      </span>
                    )}
                  </div>
                )}

                {/* Remark Text Card */}
                <div
                  style={{
                    padding: "18px 20px",
                    borderRadius: "var(--radius)",
                    background: "rgba(139, 107, 255, 0.06)",
                    border: "1px solid rgba(139, 107, 255, 0.25)",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                    position: "relative",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 15,
                      lineHeight: 1.7,
                      color: "var(--ink)",
                      fontStyle: "italic",
                    }}
                  >
                    “{resultData.remark}”
                  </p>
                </div>

                <p style={{ margin: 0, fontSize: 12, color: "var(--ink-faint)" }}>
                  Tip: Use the <strong>Copy remark</strong> button above to paste this directly into student appraisal records or grade reports.
                </p>
              </div>
            ) : (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 20px",
                  color: "var(--ink-faint)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "var(--navy-tint)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--seal-brass)",
                  }}
                >
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 15, color: "var(--ink-soft)" }}>No remark generated yet</h3>
                  <p style={{ margin: 0, fontSize: 13, maxWidth: 320 }}>
                    Enter a student roll number and click <strong>Generate remark</strong> to retrieve their published marks and produce AI-assisted feedback.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
