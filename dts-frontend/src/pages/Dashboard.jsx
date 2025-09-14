import { useEffect, useState } from "react";
import api from "../lib/api";

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api.listJobs("", 1, 100);
        const items = Array.isArray(data.items) ? data.items : data;
        setJobs(items);
      } catch (e) {
        setErr(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const total = jobs.length;
  const active = jobs.filter((j) => !j.paused).length;
  const paused = total - active;
  const http = jobs.filter((j) => j.type === "http").length;
  const script = jobs.filter((j) => j.type === "script").length;

  return (
    <div className="page">
      <h2 style={{ marginBottom: 12 }}>Dashboard</h2>
      {err && (
        <div
          className="card"
          style={{ borderColor: "var(--danger)", color: "#ffd9e0" }}
        >
          {err}
        </div>
      )}
      {loading ? (
        <div className="card">Loading…</div>
      ) : (
        <>
          <div className="grid cols-3" style={{ marginBottom: 12 }}>
            <div className="kpi">
              <span className="label">Total Jobs</span>
              <span className="value">{total}</span>
            </div>
            <div className="kpi">
              <span className="label">Active</span>
              <span className="value" style={{ color: "var(--ok)" }}>
                {active}
              </span>
            </div>
            <div className="kpi">
              <span className="label">Paused</span>
              <span className="value" style={{ color: "var(--danger)" }}>
                {paused}
              </span>
            </div>
          </div>

          <div className="grid cols-2">
            <div className="card">
              <h3 style={{ marginTop: 0 }}>By Type</h3>
              <div style={{ display: "flex", gap: 12 }}>
                <span className="badge">HTTP: {http}</span>
                <span className="badge">Script: {script}</span>
              </div>
            </div>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Quick Tips</h3>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>
                  Create jobs under <b>Jobs → New</b>.
                </li>
                <li>
                  Use <code>America/Chicago</code> for Central Time; preview
                  shows DST-aware times.
                </li>
                <li>
                  Expected HTTP statuses must include the actual response
                  status.
                </li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
