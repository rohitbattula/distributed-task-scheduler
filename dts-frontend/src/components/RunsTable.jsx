export default function RunsTable({ rows, onViewLogs }) {
  if (!rows?.length) return <div>No runs yet.</div>;
  return (
    <table className="table">
      <thead>
        <tr>
          <th align="left">Status</th>
          <th align="left">Started</th>
          <th align="left">Finished</th>
          <th align="left">Duration</th>
          <th align="left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const dur =
            r.startedAt && r.finishedAt
              ? `${Math.max(
                  1,
                  Math.round(
                    (new Date(r.finishedAt) - new Date(r.startedAt)) / 1000
                  )
                )}s`
              : "-";
          return (
            <tr key={r._id}>
              <td>
                <span
                  className="badge"
                  style={{
                    borderColor:
                      r.status === "success" ? "var(--ok)" : "var(--danger)",
                    color: r.status === "success" ? "#d2ffe7" : "#ffd1d9",
                  }}
                >
                  {r.status}
                </span>
              </td>
              <td>
                {r.startedAt ? new Date(r.startedAt).toLocaleString() : "-"}
              </td>
              <td>
                {r.finishedAt ? new Date(r.finishedAt).toLocaleString() : "-"}
              </td>
              <td>{dur}</td>
              <td>
                <button className="btn secondary" onClick={() => onViewLogs(r)}>
                  View logs
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
