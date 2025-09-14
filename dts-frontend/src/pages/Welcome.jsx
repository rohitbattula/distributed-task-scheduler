import { Link } from "react-router-dom";

export default function Welcome() {
  return (
    <div className="page">
      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0 }}>Welcome to DTS</h2>
        <p>Schedule HTTP or Script jobs with retries, logs, and run history.</p>
        <div style={{ display: "flex", gap: 12 }}>
          <Link className="btn" to="/login">
            Login
          </Link>
          <Link className="btn secondary" to="/signup">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
