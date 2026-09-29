import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, ShieldCheck, BookOpenCheck, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth, extractErrorMessage } from "../context/AuthContext";
import Seal from "../components/Seal";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (new TextEncoder().encode(form.password).length > 72) {
      setError("Password must be 72 bytes or fewer. Please use a shorter password.");
      return;
    }
    setBusy(true);
    try {
      await register({ ...form, role });
      setSuccess(true);
      setTimeout(() => navigate("/login", { replace: true }), 900);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <div className="auth-hero-top">
          <Seal size={40} tone="paper" />
          <div>
            <strong>Registrar</strong><br />
            <small>Enrollment &amp; Result Office</small>
          </div>
        </div>

        <div className="auth-hero-mid">
          <h1>Open a file, <em>join the register.</em></h1>
          <p>
            A student account for enrolling and tracking results, or a
            faculty account for managing courses, exams, and notices.
          </p>
        </div>

        <div className="auth-hero-bottom">
          <span>EST. 2026</span>
          <span>OAS 3.1</span>
          <span>SEC. VERIFIED</span>
        </div>
      </div>

      <div className="auth-panel">
        <div className="auth-card">
          <div className="auth-mark">Registrar's Office</div>
          <h1>Create account</h1>
          <p className="lede">Register to enroll in courses or manage records.</p>

          {error && <div className="error-banner"><AlertCircle size={15} /> {error}</div>}
          {success && <div className="success-banner"><CheckCircle2 size={15} /> Account created — redirecting to sign in…</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="reg-email">Email</label>
              <input id="reg-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="reg-password">Password</label>
              <input id="reg-password" type="password" minLength="6" maxLength="72" value={form.password} onChange={(e) => update("password", e.target.value)} required />
            </div>

            <div className="field">
              <label>Role</label>
              <div className="role-toggle">
                <button type="button" className={role === "student" ? "active" : ""} onClick={() => setRole("student")}>
                  <GraduationCap size={15} /> Student
                </button>
                <button type="button" className={role === "faculty" ? "active" : ""} onClick={() => setRole("faculty")}>
                  <BookOpenCheck size={15} /> Faculty
                </button>
                <button type="button" className={role === "admin" ? "active" : ""} onClick={() => setRole("admin")}>
                  <ShieldCheck size={15} /> Admin
                </button>
              </div>
            </div>

            <button className="btn btn-block" type="submit" disabled={busy}>
              {busy ? "Creating…" : <>Create account <ArrowRight size={15} /></>}
            </button>
          </form>

          <div className="auth-switch">
            Already registered? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
