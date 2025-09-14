export default function Confirm({
  open,
  title = "Are you sure?",
  body = "",
  onCancel,
  onConfirm,
}) {
  if (!open) return null;
  return (
    <div className="modal" onClick={onCancel}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        {body && <p style={{ color: "var(--muted)" }}>{body}</p>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn danger" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
