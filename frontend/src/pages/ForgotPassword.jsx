import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../api/auth";
import { extractErrorMessage } from "../api/client";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try { setMessage((await requestPasswordReset(email)).data.message); }
    catch (err) { setError(extractErrorMessage(err)); }
    finally { setBusy(false); }
  }

  return <div className="auth-wrap auth-single"><div className="auth-panel"><div className="auth-card">
    <div className="auth-mark">Account recovery</div><h1>Reset password</h1>
    <p className="lede">Enter your account email and we'll send a verification code.</p>
    {error && <div className="error-banner">{error}</div>}{message && <div className="success-banner">{message}</div>}
    <form onSubmit={submit}><div className="field"><label htmlFor="reset-email">Email</label><input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div><button className="btn btn-block" disabled={busy}>{busy ? "Sending..." : "Send verification code"}</button></form>
    <div className="auth-switch"><Link to="/reset-password">I have a code</Link><Link to="/login">Back to sign in</Link></div>
  </div></div></div>;
}
