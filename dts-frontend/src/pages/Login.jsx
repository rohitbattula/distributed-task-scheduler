import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider.jsx";
import { useToast } from "../components/Toaster.jsx";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errs, setErrs] = useState([]);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErrs([]);
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      nav("/dashboard", { replace: true });
    } catch (e) {
      setErrs(e.messages || [e.message || "Login failed"]);
      toast.error("Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 480, margin: "0 auto" }}>
        <h2>Login</h2>
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
          <label>
            Password
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
          <button disabled={busy} className="btn">
            {busy ? "Logging in..." : "Login"}
          </button>
          <div style={{ display: "flex", gap: 12 }}>
            <Link to="/signup">Sign up</Link>
            <Link to="/forgot">Forgot password?</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
