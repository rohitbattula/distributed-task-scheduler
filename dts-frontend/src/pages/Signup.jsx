import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthProvider.jsx";
import { useToast } from "../components/Toaster.jsx";

export default function Signup() {
  const nav = useNavigate();
  const { register } = useAuth();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errs, setErrs] = useState([]);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErrs([]);
    setBusy(true);
    try {
      await register(name, email, password);
      toast.success("Account created");
      nav("/dashboard", { replace: true });
    } catch (e) {
      setErrs(e.messages || [e.message || "Signup failed"]);
      toast.error("Signup failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
        <h2>Sign up</h2>
        <form onSubmit={submit} className="grid">
          <label>
            Name
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
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
            {busy ? "Creating..." : "Create account"}
          </button>
          <div>
            <Link to="/login">Already have an account? Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
