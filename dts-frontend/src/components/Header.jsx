import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthProvider.jsx";

export default function Header() {
  const { token, user, logout } = useAuth();
  const loc = useLocation();
  const is = (p) =>
    loc.pathname === p || loc.pathname.startsWith(p) ? "active" : "";

  return (
    <header className="appbar">
      <Link to="/" className="brand">
        DTS
      </Link>
      <nav>
        {token ? (
          <>
            <Link className={is("/dashboard")} to="/dashboard">
              Dashboard
            </Link>
            <Link className={is("/jobs")} to="/jobs">
              Jobs
            </Link>
            <button onClick={logout}>Logout</button>
            <span style={{ color: "var(--muted)" }}>{user?.name}</span>
          </>
        ) : (
          <>
            <Link className={is("/login")} to="/login">
              Login
            </Link>
            <Link className={is("/signup")} to="/signup">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
