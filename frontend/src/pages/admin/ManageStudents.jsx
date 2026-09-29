import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import Shell from "../../components/Shell";
import { createStudent, deleteStudent, listStudents } from "../../api/students";
import { extractErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { ADMIN_NAV } from "./nav";
import { DEPARTMENTS, departmentLabel } from "../../constants/departments";
import { SEMESTERS, semesterLabel } from "../../constants/semesters";

const EMPTY_FORM = { name: "", email: "", roll_number: "", department: "CSE", semester: "1" };

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [department, setDepartment] = useState("");
  const { role } = useAuth();

  async function load() {
    setLoading(true);
    try {
      const res = await listStudents(department);
      setStudents(res.data || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [department]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await createStudent({ ...form, semester: Number(form.semester) });
      setSuccess(`Student record created${res.data?.id ? ` (id ${res.data.id})` : ""}.`);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(student) {
    const confirmed = window.confirm(
      `Delete ${student.name}'s student registry record? This does not delete the login account or published results.`
    );
    if (!confirmed) return;

    setDeletingId(student.id);
    setError("");
    setSuccess("");
    try {
      await deleteStudent(student.id);
      setStudents((current) => current.filter((item) => item.id !== student.id));
      setSuccess(`${student.name}'s student record was deleted.`);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Shell groups={ADMIN_NAV}>
      <p className="page-eyebrow">Registry</p>
      <h1 className="page-title">Students</h1>
      <p className="page-subtitle">Organize student records by department and semester.</p>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-header">
          <h2>All students</h2>
          <select aria-label="Filter students by department" value={department} onChange={(event) => setDepartment(event.target.value)} style={{ maxWidth: 280 }}>
            <option value="">All departments</option>
            {DEPARTMENTS.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
          </select>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="ledger">
            <thead><tr><th>ID</th><th>Name</th><th>Roll No.</th><th>Department</th><th>Semester</th><th>Email</th><th>Actions</th></tr></thead>
            <tbody>
              {!loading && students.length === 0 && (
                <tr className="empty-row"><td colSpan={7}>No student records found for this department.</td></tr>
              )}
              {students.map((student) => (
                <tr key={student.id}>
                  <td>
                    <button
                      className="btn btn-sm btn-outline"
                      type="button"
                      onClick={() => navigator.clipboard.writeText(student.id)}
                      title={student.id}
                    >
                      Copy ID
                    </button>
                  </td>
                  <td>{student.name}</td>
                  <td className="num">{student.roll_number}</td>
                  <td>{departmentLabel(student.department)}</td>
                  <td>{semesterLabel(student.semester || 1)}</td>
                  <td>{student.email}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-danger"
                      type="button"
                      disabled={deletingId === student.id}
                      onClick={() => handleDelete(student)}
                    >
                      <Trash2 size={13} /> {deletingId === student.id ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {role === "admin" && (
        <div className="panel" style={{ maxWidth: 460 }}>
          <div className="panel-header"><h2>New student</h2></div>
          <div className="panel-body">
            <form onSubmit={handleCreate}>
              <div className="field">
                <label htmlFor="s-name">Full name</label>
                <input id="s-name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="s-email">Email</label>
                <input id="s-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="s-roll">Roll number</label>
                <input id="s-roll" value={form.roll_number} onChange={(e) => update("roll_number", e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="s-department">Department</label>
                <select id="s-department" value={form.department} onChange={(e) => update("department", e.target.value)} required>
                  {DEPARTMENTS.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="s-semester">Semester</label>
                <select id="s-semester" value={form.semester} onChange={(e) => update("semester", e.target.value)} required>
                  {SEMESTERS.map((item) => <option key={item} value={item}>{semesterLabel(item)}</option>)}
                </select>
              </div>
              <button className="btn btn-block" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Create student"}
              </button>
            </form>
          </div>
        </div>
      )}
    </Shell>
  );
}
