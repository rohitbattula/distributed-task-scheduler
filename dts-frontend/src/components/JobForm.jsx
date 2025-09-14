import { useEffect, useMemo, useState } from "react";
import api from "../lib/api";

const TZ_OPTS = [
  "UTC",
  "America/Chicago",
  "America/Los_Angeles",
  "Asia/Kolkata",
];

/** Safe formatter that shows local date/time in a target timezone */
function formatWhen(isoOrAny, tz) {
  // if API already gave a string that looks like date, try to parse
  const raw =
    typeof isoOrAny === "string"
      ? isoOrAny
      : (() => {
          try {
            return JSON.stringify(isoOrAny);
          } catch {
            return String(isoOrAny);
          }
        })();

  const d = new Date(raw);
  if (!isFinite(d.valueOf())) {
    // not a parseable date: show as-is
    return { pretty: raw, iso: raw };
  }

  const pretty = new Intl.DateTimeFormat(undefined, {
    timeZone: tz || "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
  return { pretty, iso: d.toISOString() };
}

export default function JobForm({ initial, onSubmit, submitting }) {
  const [type, setType] = useState(initial?.type || "http");
  const [name, setName] = useState(initial?.name || "");
  const [schedule, setSchedule] = useState(initial?.schedule || "*/5 * * * *");
  const [timezone, setTimezone] = useState(initial?.timezone || "UTC");
  const [retries, setRetries] = useState(
    initial?.retries !== undefined ? String(initial.retries) : "0"
  );
  const [backoffSec, setBackoffSec] = useState(
    initial?.backoffSec !== undefined ? String(initial.backoffSec) : "60"
  );
  const [paused, setPaused] = useState(initial?.paused || false);

  const [http, setHttp] = useState(
    initial?.http || {
      method: "GET",
      url: "",
      headers: {},
      body: "",
      timeoutMs: 10000,
      followRedirects: true,
      expectedStatus: [200],
    }
  );
  const [script, setScript] = useState(
    initial?.script || {
      command: "",
      args: [],
      cwd: "",
      env: {},
      timeoutMs: 20000,
      maxBufferKB: 1024,
    }
  );

  // Preview via backend inspector
  const [preview, setPreview] = useState([]);
  const [cronErr, setCronErr] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const canPreview = useMemo(() => schedule && timezone, [schedule, timezone]);

  useEffect(() => {
    if (!canPreview) {
      setPreview([]);
      setCronErr("");
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        setLoadingPreview(true);
        const data = await api.preview(schedule, timezone, 5);
        if (cancelled) return;
        const arr = Array.isArray(data?.next) ? data.next : [];
        setPreview(arr);
        setCronErr(arr.length ? "" : data?.message || "");
      } catch (e) {
        if (!cancelled) {
          setPreview([]);
          setCronErr(
            e?.messages?.[0] || e?.message || "Invalid cron or timezone."
          );
        }
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [schedule, timezone, canPreview]);

  const submit = (e) => {
    e.preventDefault();
    const base = {
      type,
      name,
      schedule,
      timezone,
      // send as numbers if valid; otherwise default
      retries: Number.isFinite(+retries) ? +retries : 0,
      backoffSec: Number.isFinite(+backoffSec) ? +backoffSec : 60,
      paused,
    };
    const payload =
      type === "http"
        ? {
            ...base,
            http: {
              ...http,
              timeoutMs: Number.isFinite(+http.timeoutMs)
                ? +http.timeoutMs
                : 10000,
            },
          }
        : {
            ...base,
            script: {
              ...script,
              timeoutMs: Number.isFinite(+script.timeoutMs)
                ? +script.timeoutMs
                : 20000,
            },
          };

    onSubmit(payload);
  };

  return (
    <form onSubmit={submit} className="grid" style={{ gap: 16 }}>
      <div className="card grid cols-2">
        <label>
          Type
          <select
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="http">HTTP</option>
            <option value="script">Script</option>
          </select>
        </label>
        <label>
          Name
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My job"
          />
        </label>

        <label>
          Schedule (cron)
          <input
            className="input"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            placeholder="*/5 * * * *"
          />
        </label>
        <label>
          Timezone
          <select
            className="input"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            {TZ_OPTS.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>

        {/* text boxes (no number spinners) */}
        <label>
          Retries
          <input
            className="input"
            type="text"
            inputMode="numeric"
            value={retries}
            onChange={(e) => setRetries(e.target.value)}
          />
        </label>
        <label>
          Backoff (sec)
          <input
            className="input"
            type="text"
            inputMode="numeric"
            value={backoffSec}
            onChange={(e) => setBackoffSec(e.target.value)}
          />
        </label>

        {/* aligned checkbox row */}
        <div className="switch-row">
          <input
            id="paused-switch"
            type="checkbox"
            checked={paused}
            onChange={(e) => setPaused(e.target.checked)}
          />
          <label htmlFor="paused-switch">Paused</label>
        </div>
      </div>

      {type === "http" ? (
        <div className="card grid cols-2">
          <label>
            Method
            <select
              className="input"
              value={http.method}
              onChange={(e) => setHttp({ ...http, method: e.target.value })}
            >
              {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label>
            URL
            <input
              className="input"
              value={http.url}
              onChange={(e) => setHttp({ ...http, url: e.target.value })}
              placeholder="https://..."
            />
          </label>

          <label style={{ gridColumn: "1 / -1" }}>
            Headers (JSON)
            <textarea
              className="input"
              rows={3}
              value={JSON.stringify(http.headers || {}, null, 2)}
              onChange={(e) => {
                try {
                  setHttp({
                    ...http,
                    headers: JSON.parse(e.target.value || "{}"),
                  });
                } catch {}
              }}
            />
          </label>

          <label style={{ gridColumn: "1 / -1" }}>
            Body
            <textarea
              className="input"
              rows={3}
              value={http.body || ""}
              onChange={(e) => setHttp({ ...http, body: e.target.value })}
            />
          </label>

          {/* timeout as text box */}
          <label>
            Timeout (ms)
            <input
              className="input"
              type="text"
              inputMode="numeric"
              value={String(http.timeoutMs ?? "")}
              onChange={(e) => setHttp({ ...http, timeoutMs: e.target.value })}
            />
          </label>

          {/* aligned checkbox */}
          <div className="switch-row">
            <input
              id="redirects-switch"
              type="checkbox"
              checked={!!http.followRedirects}
              onChange={(e) =>
                setHttp({ ...http, followRedirects: e.target.checked })
              }
            />
            <label htmlFor="redirects-switch">Follow Redirects</label>
          </div>

          <label style={{ gridColumn: "1 / -1" }}>
            Expected Status (comma sep)
            <input
              className="input"
              value={(http.expectedStatus || []).join(",")}
              onChange={(e) =>
                setHttp({
                  ...http,
                  expectedStatus: e.target.value
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean)
                    .map((x) => +x),
                })
              }
            />
          </label>
        </div>
      ) : (
        <div className="card grid cols-2">
          <label>
            Command
            <input
              className="input"
              value={script.command}
              onChange={(e) =>
                setScript({ ...script, command: e.target.value })
              }
              placeholder="node"
            />
          </label>
          <label>
            Args (JSON array)
            <input
              className="input"
              value={JSON.stringify(script.args || [])}
              onChange={(e) => {
                try {
                  setScript({
                    ...script,
                    args: JSON.parse(e.target.value || "[]"),
                  });
                } catch {}
              }}
            />
          </label>
          <label>
            CWD
            <input
              className="input"
              value={script.cwd}
              onChange={(e) => setScript({ ...script, cwd: e.target.value })}
            />
          </label>
          <label>
            Env (JSON)
            <textarea
              className="input"
              rows={3}
              value={JSON.stringify(script.env || {}, null, 2)}
              onChange={(e) => {
                try {
                  setScript({
                    ...script,
                    env: JSON.parse(e.target.value || "{}"),
                  });
                } catch {}
              }}
            />
          </label>
          <label>
            Timeout (ms)
            <input
              className="input"
              type="text"
              inputMode="numeric"
              value={String(script.timeoutMs ?? "")}
              onChange={(e) =>
                setScript({ ...script, timeoutMs: e.target.value })
              }
            />
          </label>
          <label>
            maxBuffer (KB)
            <input
              className="input"
              type="text"
              inputMode="numeric"
              value={String(script.maxBufferKB ?? "")}
              onChange={(e) =>
                setScript({ ...script, maxBufferKB: e.target.value })
              }
            />
          </label>
        </div>
      )}

      <div className="card">
        <strong>Next runs (server preview · {timezone})</strong>
        {loadingPreview && (
          <div style={{ color: "var(--muted)", marginTop: 6 }}>Loading…</div>
        )}
        {cronErr && !loadingPreview && (
          <div style={{ color: "var(--danger)", marginTop: 6 }}>{cronErr}</div>
        )}
        {!cronErr && !loadingPreview && preview.length === 0 && (
          <div style={{ color: "var(--muted)" }}>No preview.</div>
        )}
        {preview.length > 0 && (
          <ul style={{ margin: "10px 0 0 14px", lineHeight: 1.5 }}>
            {preview.map((p, i) => {
              const f = formatWhen(p, timezone);
              return (
                <li key={i}>
                  <span
                    style={{
                      fontFeatureSettings: '"tnum" 1',
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {f.pretty}
                  </span>
                  <span
                    style={{
                      color: "var(--muted)",
                      marginLeft: 8,
                      fontSize: 12,
                    }}
                  >
                    ({f.iso})
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div>
        <button disabled={submitting} className="btn" type="submit">
          {submitting ? "Saving..." : "Save Job"}
        </button>
      </div>
    </form>
  );
}
