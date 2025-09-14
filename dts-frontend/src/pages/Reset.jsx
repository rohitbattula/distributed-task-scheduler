import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useToast } from "../components/Toaster.jsx";

export default function Reset() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errs, setErrs] = useState([]);
  const [ok, setOk] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErrs([]);
    setOk("");
    setBusy(true);
    try {
      const data = await api.reset({ token, password });
      setOk(data.message || "Password reset!");
      toast.success("Password reset");
      setTimeout(() => nav("/login", { replace: true }), 800);
    } catch (e) {
      setErrs(e.messages || [e.message || "Reset failed"]);
      toast.error("Reset failed");
    } finally {
      setBusy(false);
    }
  };

  if (!token)
    return (
      <div className="page">
        <div className="card">Missing reset token.</div>
      </div>
    );

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 480, margin: "0 auto" }}>
        <h2>Reset password</h2>
        <form onSubmit={submit} className="grid">
          <label>
            New password
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {busy ? "Resetting..." : "Reset"}
          </button>
        </form>
      </div>
    </div>
  );
}
