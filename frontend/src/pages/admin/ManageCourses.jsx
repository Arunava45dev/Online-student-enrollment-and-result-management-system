import { useEffect, useState } from "react";
import { BookOpen, LayoutGrid, GraduationCap, PlusCircle, AlertCircle } from "lucide-react";
import Shell from "../../components/Shell";
import Loader from "../../components/Loader";
import { listCourses, createCourse, deleteCourse } from "../../api/courses";
import { extractErrorMessage } from "../../api/client";
import { FACULTY_NAV } from "./nav";
import { SEMESTERS, semesterLabel } from "../../constants/semesters";

const EMPTY_FORM = { code: "", title: "", credits: "", description: "", semester: "1" };

export default function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await listCourses();
      setCourses(res.data || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createCourse({ ...form, credits: Number(form.credits) || 0, semester: Number(form.semester) });
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    setError("");
    try {
      await deleteCourse(id);
      setCourses((c) => c.filter((row) => row.id !== id));
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Shell groups={FACULTY_NAV}>
      <p className="page-eyebrow">Catalog</p>
      <h1 className="page-title">Courses</h1>
      <p className="page-subtitle">Create and remove courses in the catalog.</p>

      {error && <div className="error-banner"><AlertCircle size={15} /> {error}</div>}

      {!loading && (
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-label"><LayoutGrid size={13} /> Total courses</div>
            <div className="stat-value">{courses.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label"><GraduationCap size={13} /> Total credits</div>
            <div className="stat-value">{courses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0)}</div>
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="panel section-gap">
          <div className="panel-header"><h2><BookOpen size={16} /> All courses</h2></div>
          <div style={{ overflowX: "auto" }}>
            {loading ? (
              <Loader />
            ) : (
              <table className="ledger">
                <thead><tr><th>Semester</th><th>Code</th><th>Title</th><th>Credits</th><th></th></tr></thead>
                <tbody>
                  {courses.length === 0 && (
                    <tr className="empty-row"><td colSpan={4}>No courses yet — add one.</td></tr>
                  )}
                  {courses.map((c) => (
                    <tr key={c.id}>
                      <td>{semesterLabel(c.semester || 1)}</td>
                      <td className="num">{c.code}</td>
                      <td>{c.title}</td>
                      <td className="num">{c.credits}</td>
                      <td>
                        <button className="btn btn-sm btn-danger" disabled={deletingId === c.id} onClick={() => handleDelete(c.id)}>
                          {deletingId === c.id ? "Removing…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="panel section-gap">
          <div className="panel-header"><h2><PlusCircle size={16} /> Add course</h2></div>
          <div className="panel-body">
            <form onSubmit={handleCreate}>
              <div className="field">
                <label htmlFor="semester">Semester</label>
                <select id="semester" value={form.semester} onChange={(e) => update("semester", e.target.value)} required>
                  {SEMESTERS.map((semester) => <option key={semester} value={semester}>{semesterLabel(semester)}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="code">Course code</label>
                <input id="code" value={form.code} onChange={(e) => update("code", e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="title">Title</label>
                <input id="title" value={form.title} onChange={(e) => update("title", e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="credits">Credits</label>
                <input id="credits" type="number" min="0" value={form.credits} onChange={(e) => update("credits", e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="description">Description</label>
                <textarea id="description" value={form.description} onChange={(e) => update("description", e.target.value)} />
              </div>
              <button className="btn btn-block" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Add course"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Shell>
  );
}
