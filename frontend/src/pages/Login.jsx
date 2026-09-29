import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, ShieldCheck, BookOpenCheck, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth, extractErrorMessage } from "../context/AuthContext";
import Seal from "../components/Seal";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fallbackRole, setFallbackRole] = useState("student");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const resolvedRole = await login({ email, password, fallbackRole });
      if (resolvedRole === "student") navigate("/student", { replace: true });
      else if (resolvedRole === "faculty") navigate("/faculty", { replace: true });
      else navigate("/admin", { replace: true });
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
          <h1>Every record, <em>properly kept.</em></h1>
          <p>
            Enroll in courses, track results, and read faculty notices —
            all in one office ledger, open around the clock.
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
          <h1>Sign in</h1>
          <p className="lede">Enter your credentials to open your record.</p>

          {error && (
            <div className="error-banner"><AlertCircle size={15} /> {error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <div className="field">
              <label>Enter as</label>
              <div className="role-toggle">
                <button type="button" className={fallbackRole === "student" ? "active" : ""} onClick={() => setFallbackRole("student")}>
                  <GraduationCap size={15} /> Student
                </button>
                <button type="button" className={fallbackRole === "faculty" ? "active" : ""} onClick={() => setFallbackRole("faculty")}>
                  <BookOpenCheck size={15} /> Faculty
                </button>
                <button type="button" className={fallbackRole === "admin" ? "active" : ""} onClick={() => setFallbackRole("admin")}>
                  <ShieldCheck size={15} /> Admin
                </button>
              </div>
            </div>

            <button className="btn btn-block" type="submit" disabled={busy}>
              {busy ? "Signing in…" : <>Sign in <ArrowRight size={15} /></>}
            </button>
          </form>

          <div className="auth-switch">
            New here? <Link to="/register">Create an account</Link>
          </div>
          <div className="auth-switch auth-reset-link"><Link to="/forgot-password">Forgot your password?</Link></div>
        </div>
      </div>
    </div>
  );
}
