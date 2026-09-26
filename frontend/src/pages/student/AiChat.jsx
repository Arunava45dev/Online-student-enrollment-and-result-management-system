import { useState } from "react";
import Shell from "../../components/Shell";
import { sendChatMessage } from "../../api/ai";
import { extractErrorMessage } from "../../api/client";
import { STUDENT_NAV } from "./nav";

export default function AiChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setError("");
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);
    try {
      const res = await sendChatMessage({ message: text, history: messages });
      const reply = res.data?.reply || res.data?.message || "…";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell groups={STUDENT_NAV}>
      <p className="page-eyebrow">Assistant</p>
      <h1 className="page-title">Ask the AI assistant</h1>
      <p className="page-subtitle">Questions about courses, enrollment, or your results.</p>

      {error && <div className="error-banner">{error}</div>}

      <div className="panel panel-body">
        <div className="chat-log">
          {messages.length === 0 && <p className="muted">Start the conversation below.</p>}
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role === "user" ? "user" : "assistant"}`}>
              {m.content}
            </div>
          ))}
          {busy && <div className="chat-bubble assistant">Thinking…</div>}
        </div>
        <form className="chat-input-row" onSubmit={handleSend}>
          <input
            placeholder="Type your question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
          />
          <button className="btn" type="submit" disabled={busy || !input.trim()}>Send</button>
        </form>
      </div>
    </Shell>
  );
}
