import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="auth-mark">404</div>
        <h1>No such record</h1>
        <p className="lede">That page isn't on file.</p>
        <Link className="btn" to="/login">Back to sign in</Link>
      </div>
    </div>
  );
}
