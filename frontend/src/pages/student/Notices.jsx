import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import Loader from "../../components/Loader";
import { listNotices } from "../../api/notices";
import { extractErrorMessage } from "../../api/client";
import { STUDENT_NAV } from "./nav";

export default function Notices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await listNotices();
        setNotices(res.data || []);
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Shell groups={STUDENT_NAV}>
      <p className="page-eyebrow">Announcements</p>
      <h1 className="page-title">Notices</h1>
      <p className="page-subtitle">Announcements from the registrar and faculty.</p>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <Loader />
      ) : notices.length === 0 ? (
        <div className="panel panel-body"><p className="muted" style={{margin:0}}>No notices posted yet.</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {notices.map((n) => (
            <div className="panel panel-body" key={n.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                <strong>{n.title}</strong>
                <span className="muted" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
                  {n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}
                </span>
              </div>
              <p style={{ margin: 0 }}>{n.content}</p>
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
