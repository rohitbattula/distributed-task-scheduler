import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthProvider";

function StatusBadge({ value }) {
  const cls =
    value === "active" || value === "succeeded"
      ? "badge ok"
      : value === "paused" || value === "failed"
      ? "badge warn"
      : "badge";
  return <span className={cls}>{value}</span>;
}

export default function JobsPage() {
  const { token } = useAuth();
  const nav = useNavigate();

  const [all, setAll] = useState([]);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      // Expect backend to return { items: [...] }
      const d = await api("/jobs", { token });
      const rows = Array.isArray(d?.items)
        ? d.items
        : Array.isArray(d)
        ? d
        : [];
      setAll(rows);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [token]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return all;
    return all.filter(
      (r) =>
        (r.name || "").toLowerCase().includes(term) ||
        (r.type || "").toLowerCase().includes(term) ||
        (r.status || "").toLowerCase().includes(term)
    );
  }, [all, q]);

  return (
    <div className="container">
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h1 style={{ margin: 0 }}>Jobs</h1>
          <div className="actions">
            <Link to="/jobs/new" className="btn">
              Create Job
            </Link>
            <button className="btn-ghost" onClick={load}>
              Refresh
            </button>
          </div>
        </div>

        <div className="toolbar">
          <input
            className="input-sm"
            placeholder="Search name / type / status…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ flex: "1 1 260px" }}
          />
        </div>

        {err ? (
          <div className="error" style={{ marginBottom: 10 }}>
            Error: {err}
          </div>
        ) : null}
        {loading ? (
          <div>Loading…</div>
        ) : rows.length ? (
          <table className="table">
            <thead>
              <tr>
                <th className="th">Name</th>
                <th className="th">Type</th>
                <th className="th">Status</th>
                <th className="th">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id || r._id}
                  className="row"
                  style={{ cursor: "pointer" }}
                  onClick={() => nav(`/jobs/${r.id || r._id}`)} // detail page comes in Step 4
                >
                  <td className="td">{r.name || r.id}</td>
                  <td className="td">{r.type || "—"}</td>
                  <td className="td">
                    <StatusBadge value={r.status || "—"} />
                  </td>
                  <td className="td">
                    {r.updatedAt ? new Date(r.updatedAt).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ color: "#64748b" }}>No jobs found.</div>
        )}
      </div>
    </div>
  );
}
