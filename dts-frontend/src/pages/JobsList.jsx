import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import Confirm from "../components/Confirm.jsx";
import { useToast } from "../components/Toaster.jsx";

export default function JobsList() {
  const nav = useNavigate();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const [confirmId, setConfirmId] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const data = await api.listJobs(q, page, 10);
      const items = Array.isArray(data.items) ? data.items : data;
      setRows(items);
      setMeta({
        page: data.page || 1,
        pages: data.pages || 1,
        total: data.total || items.length,
      });
    } catch (e) {
      setErr(e.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [page]);

  const onDelete = async (id) => {
    try {
      await api.deleteJob(id);
      toast.success("Job deleted");
      await load();
    } catch (e) {
      toast.error(e.message || "Delete failed");
    } finally {
      setConfirmId("");
    }
  };

  const onPauseResume = async (j) => {
    try {
      await api.updateJob(j._id, { paused: !j.paused });
      toast.success(j.paused ? "Job resumed" : "Job paused");
      await load();
    } catch (e) {
      toast.error(e.message || "Update failed");
    }
  };

  return (
    <div className="page">
      <div className="grid" style={{ gap: 12, marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0 }}>Jobs</h2>
          <button className="btn" onClick={() => nav("/jobs/new")}>
            + New Job
          </button>
        </div>
        <div className="card" style={{ display: "flex", gap: 8 }}>
          <input
            className="input"
            placeholder="Search name/url..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            className="btn secondary"
            onClick={() => {
              setPage(1);
              load();
            }}
          >
            Search
          </button>
        </div>
      </div>

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
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th align="left">Name</th>
                <th>Type</th>
                <th>Schedule</th>
                <th>TZ</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((j) => (
                <tr key={j._id}>
                  <td align="left">
                    <Link to={`/jobs/${j._id}`}>{j.name}</Link>
                  </td>
                  <td align="center">{j.type}</td>
                  <td align="center">
                    <code>{j.schedule}</code>
                  </td>
                  <td align="center">{j.timezone || "UTC"}</td>
                  <td align="center">
                    <span
                      className="badge"
                      style={{
                        borderColor: j.paused ? "var(--danger)" : "var(--ok)",
                        color: j.paused ? "#ffd1d9" : "#d2ffe7",
                      }}
                    >
                      {j.paused ? "Paused" : "Active"}
                    </span>
                  </td>
                  <td
                    align="center"
                    style={{
                      display: "flex",
                      gap: 8,
                      justifyContent: "center",
                    }}
                  >
                    <button
                      className="btn secondary"
                      onClick={() => onPauseResume(j)}
                    >
                      {j.paused ? "Resume" : "Pause"}
                    </button>
                    <button
                      className="btn danger"
                      onClick={() => setConfirmId(j._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    align="center"
                    style={{ color: "var(--muted)", padding: 18 }}
                  >
                    No jobs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div
            style={{
              marginTop: 12,
              display: "flex",
              gap: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <button
              className="btn secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </button>
            <div style={{ color: "var(--muted)" }}>
              Page {meta.page} / {meta.pages}
            </div>
            <button
              className="btn secondary"
              disabled={page >= meta.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <Confirm
        open={!!confirmId}
        title="Delete job?"
        body="This cannot be undone."
        onCancel={() => setConfirmId("")}
        onConfirm={() => onDelete(confirmId)}
      />
    </div>
  );
}
