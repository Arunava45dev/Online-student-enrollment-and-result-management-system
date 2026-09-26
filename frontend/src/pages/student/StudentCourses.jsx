import { useEffect, useState } from "react";
import { BookOpen, LayoutGrid, GraduationCap, AlertCircle, CheckCircle2 } from "lucide-react";
import Shell from "../../components/Shell";
import Loader from "../../components/Loader";
import { listCourses } from "../../api/courses";
import { enroll } from "../../api/enrollments";
import { extractErrorMessage } from "../../api/client";
import { STUDENT_NAV } from "./nav";
import { SEMESTERS, semesterLabel } from "../../constants/semesters";

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [enrollingId, setEnrollingId] = useState(null);
  const [semester, setSemester] = useState(1);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await listCourses(semester);
      setCourses(res.data || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [semester]);

  async function handleEnroll(courseId) {
    setEnrollingId(courseId);
    setNotice("");
    setError("");
    try {
      await enroll({ course_id: courseId });
      setNotice("Enrolled — check My Enrollments to confirm.");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setEnrollingId(null);
    }
  }

  return (
    <Shell groups={STUDENT_NAV}>
      <p className="page-eyebrow">Catalog</p>
      <h1 className="page-title">Course catalog</h1>
      <p className="page-subtitle">Choose a semester, then enroll in its available courses.</p>

      <div className="field" style={{ maxWidth: 240 }}>
        <label htmlFor="semester">Semester</label>
        <select id="semester" value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
          {SEMESTERS.map((item) => <option key={item} value={item}>{semesterLabel(item)}</option>)}
        </select>
      </div>

      {error && <div className="error-banner"><AlertCircle size={15} /> {error}</div>}
      {notice && <div className="success-banner"><CheckCircle2 size={15} /> {notice}</div>}

      {!loading && (
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-label"><LayoutGrid size={13} /> Courses offered</div>
            <div className="stat-value">{courses.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label"><GraduationCap size={13} /> Credits on offer</div>
            <div className="stat-value">{courses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0)}</div>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-header"><h2><BookOpen size={16} /> {semesterLabel(semester)} courses</h2></div>
        {loading ? (
          <Loader />
        ) : (
          <table className="ledger">
            <thead>
              <tr><th>Code</th><th>Title</th><th>Credits</th><th></th></tr>
            </thead>
            <tbody>
              {courses.length === 0 && (
                <tr className="empty-row"><td colSpan={4}>No courses on file yet.</td></tr>
              )}
              {courses.map((c) => (
                <tr key={c.id}>
                  <td className="num">{c.code}</td>
                  <td>{c.title}</td>
                  <td className="num">{c.credits}</td>
                  <td>
                    <button className="btn btn-sm" disabled={enrollingId === c.id} onClick={() => handleEnroll(c.id)}>
                      {enrollingId === c.id ? "Enrolling…" : "Enroll"}
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
