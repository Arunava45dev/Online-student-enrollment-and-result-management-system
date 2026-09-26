import { useEffect, useState } from "react";
import Shell from "../../components/Shell";
import Loader from "../../components/Loader";
import { listNotices, createNotice, deleteNotice } from "../../api/notices";
import { extractErrorMessage } from "../../api/client";
import { ADMIN_NAV } from "./nav";

const EMPTY_FORM = { title: "", content: "" };

export default function ManageNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await listNotices();
      setNotices(res.data || []);
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
      await createNotice(form);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(notice) {
    if (!window.confirm(`Delete the notice “${notice.title}”?`)) return;
    setError("");
    try { await deleteNotice(notice.id); await load(); }
    catch (err) { setError(extractErrorMessage(err)); }
  }

  return (
    <Shell groups={ADMIN_NAV}>
      <p className="page-eyebrow">Announcements</p>
      <h1 className="page-title">Notices</h1>
      <p className="page-subtitle">Post announcements for students.</p>

      {error && <div className="error-banner">{error}</div>}

      <div className="grid-2">
        <div className="panel section-gap">
          <div className="panel-header"><h2>Posted notices</h2></div>
          <div className="panel-body">
            {loading ? (
              <Loader />
            ) : notices.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>No notices posted yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {notices.map((n) => (
                  <div key={n.id} className="record-row">
                    <strong>{n.title}</strong>
                    <button className="btn btn-sm btn-danger" type="button" onClick={() => handleDelete(n)}>Delete</button>
                    <p style={{ margin: "4px 0 0" }}>{n.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="panel section-gap">
          <div className="panel-header"><h2>New notice</h2></div>
          <div className="panel-body">
            <form onSubmit={handleCreate}>
              <div className="field">
                <label htmlFor="n-title">Title</label>
                <input id="n-title" value={form.title} onChange={(e) => update("title", e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="n-content">Content</label>
                <textarea id="n-content" value={form.content} onChange={(e) => update("content", e.target.value)} required />
              </div>
              <button className="btn btn-block" type="submit" disabled={saving}>
                {saving ? "Posting…" : "Post notice"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Shell>
  );
}
