import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import JobForm from "../components/JobForm.jsx";
import RunsTable from "../components/RunsTable.jsx";
import Confirm from "../components/Confirm.jsx";
import { useToast } from "../components/Toaster.jsx";

export default function JobDetail() {
  const { jobId } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [job, setJob] = useState(null);
  const [runs, setRuns] = useState([]);
  const [busy, setBusy] = useState(false);
  const [errs, setErrs] = useState([]);
  const [msg, setMsg] = useState("");
  const [editing, setEditing] = useState(false);
  const [logs, setLogs] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function load() {
    setErrs([]);
    setMsg("");
    try {
      const j = await api.getJob(jobId);
      setJob(j);
      const r = await api.listRuns(jobId, 1, 20);
      setRuns(r.items || r);
    } catch (e) {
      setErrs(e.messages || [e.message || "Failed to load"]);
    }
  }

  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [jobId]);

  const save = async (payload) => {
    setBusy(true);
    setErrs([]);
    setMsg("");
    try {
      await api.updateJob(jobId, payload);
      setEditing(false);
      setMsg("Saved.");
      toast.success("Job updated");
      await load();
    } catch (e) {
      setErrs(e.messages || [e.message || "Save failed"]);
      toast.error("Save failed");
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    try {
      await api.deleteJob(jobId);
      toast.success("Job deleted");
      nav("/jobs", { replace: true });
    } catch (e) {
      toast.error(e.message || "Delete failed");
    } finally {
      setConfirmOpen(false);
    }
  };

  return (
    <div className="page">
      {!job ? (
        errs.length > 0 ? (
          <div
            className="card"
            style={{ borderColor: "var(--danger)", color: "#ffd9e0" }}
          >
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {errs.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="card">Loading...</div>
        )
      ) : (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2>{job.name}</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn secondary"
                onClick={() => setEditing((v) => !v)}
              >
                {editing ? "Cancel" : "Edit"}
              </button>
              <button
                className="btn danger"
                onClick={() => setConfirmOpen(true)}
              >
                Delete
              </button>
            </div>
          </div>

          {msg ? (
            <div className="card" style={{ marginTop: 8, color: "var(--ok)" }}>
              {msg}
            </div>
          ) : null}
          {errs.length > 0 && (
            <div
              className="card"
              style={{
                marginTop: 8,
                borderColor: "var(--danger)",
                color: "#ffd9e0",
              }}
            >
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {errs.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          {editing ? (
            <JobForm initial={job} onSubmit={save} submitting={busy} />
          ) : (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: "grid", gap: 8 }}>
                <div>
                  <strong>Type:</strong> {job.type}
                </div>
                <div>
                  <strong>Schedule:</strong> <code>{job.schedule}</code> (
                  {job.timezone || "UTC"})
                </div>
                <div>
                  <strong>Status:</strong> {job.paused ? "Paused" : "Active"}
                </div>
                <div>
                  <strong>Retries:</strong> {job.retries ?? 0} |{" "}
                  <strong>Backoff:</strong> {job.backoffSec ?? 60}s
                </div>
                {job.type === "http" ? (
                  <pre
                    style={{
                      background: "#0b111a",
                      padding: 12,
                      overflow: "auto",
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                    }}
                  >
                    {JSON.stringify(job.http, null, 2)}
                  </pre>
                ) : (
                  <pre
                    style={{
                      background: "#0b111a",
                      padding: 12,
                      overflow: "auto",
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                    }}
                  >
                    {JSON.stringify(job.script, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}

          <h3>Run history</h3>
          <div className="card">
            <RunsTable rows={runs} onViewLogs={(r) => setLogs(r?.logs || "")} />
          </div>

          {logs != null && (
            <div className="modal" onClick={() => setLogs(null)}>
              <div className="sheet" onClick={(e) => e.stopPropagation()}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <strong>Logs</strong>
                  <button
                    className="btn secondary"
                    onClick={() => setLogs(null)}
                  >
                    Close
                  </button>
                </div>
                <pre>{String(logs || "")}</pre>
              </div>
            </div>
          )}

          <Confirm
            open={confirmOpen}
            title="Delete job?"
            body="This cannot be undone."
            onCancel={() => setConfirmOpen(false)}
            onConfirm={del}
          />
        </>
      )}
    </div>
  );
}
