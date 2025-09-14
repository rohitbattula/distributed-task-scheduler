import { useState } from "react";
import api from "../lib/api";
import { useToast } from "../components/Toaster.jsx";

export default function Forgot() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [errs, setErrs] = useState([]);
  const [ok, setOk] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setOk("");
    setErrs([]);
    setBusy(true);
    try {
      const data = await api.forgot({ email });
      setOk(data.message || "If that email exists, a reset link was sent.");
      toast.success("If that email exists, we emailed you.");
    } catch (e) {
      setErrs(e.messages || [e.message || "Failed to send reset email"]);
      toast.error("Could not send reset email");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 480, margin: "0 auto" }}>
        <h2>Forgot password</h2>
        <form onSubmit={submit} className="grid">
          <label>
            Email
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {errs.length > 0 && (
            <ul style={{ color: "var(--danger)", margin: 0, paddingLeft: 18 }}>
              {errs.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          )}
          {ok ? <div style={{ color: "var(--ok)" }}>{ok}</div> : null}
          <button disabled={busy} className="btn" type="submit">
            {busy ? "Sending..." : "Send reset link"}
          </button>
        </form>
      </div>
    </div>
  );
}
