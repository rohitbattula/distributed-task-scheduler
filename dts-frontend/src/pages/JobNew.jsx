import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import JobForm from "../components/JobForm.jsx";

export default function JobNew() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (payload) => {
    setBusy(true);
    setErr("");
    try {
      const data = await api.createJob(payload);
      nav(`/jobs/${data._id}`, { replace: true });
    } catch (e) {
      setErr(e.message || "Failed to create job");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <h2>New Job</h2>
      {err && (
        <div
          className="card"
          style={{
            borderColor: "var(--danger)",
            color: "#ffd9e0",
            marginBottom: 8,
          }}
        >
          {err}
        </div>
      )}
      <JobForm initial={null} onSubmit={onSubmit} submitting={busy} />
    </div>
  );
}
