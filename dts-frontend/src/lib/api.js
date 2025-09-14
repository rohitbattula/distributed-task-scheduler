const BASE = (
  import.meta.env.VITE_API_BASE || "http://localhost:4000/api"
).replace(/\/+$/, "");

const PATHS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    forgot: "/auth/forgot",
    reset: "/auth/reset",
  },
  jobs: "/jobs",
  runs: "/runs",
  inspector: {
    preview: "/inspector/preview", // POST { cron, timezone, count, startAt? }
    jobPreview: (id) => `/inspector/job/${id}`, // GET ?count=
  },
};

function getToken() {
  return localStorage.getItem("token") || "";
}

function normalizeErrorPayload(data) {
  if (!data) return ["Something went wrong."];
  if (typeof data === "string") return [data];
  if (Array.isArray(data))
    return data.map((e) => e?.message || e?.code || "Invalid input");
  if (Array.isArray(data.errors))
    return data.errors.map((e) => e?.message || e?.code || "Invalid input");
  if (data.message || data.error) return [data.message || data.error];
  try {
    return [JSON.stringify(data)];
  } catch {
    return ["Request failed."];
  }
}

/** Build a path+query string relative to BASE (avoid /api/api) */
function withQuery(path, params) {
  const baseUrl = new URL(BASE);
  const origin = `${baseUrl.protocol}//${baseUrl.host}`;
  const u = new URL(path, origin);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
  });
  return u.pathname + u.search;
}

async function request(path, opts = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(opts.headers || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const isAbsolute = /^https?:\/\//i.test(path);
  const url = isAbsolute ? path : `${BASE}${path}`;

  const res = await fetch(url, { ...opts, headers, credentials: "include" });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const messages = normalizeErrorPayload(data);
    const err = new Error(messages.join("\n"));
    err.status = res.status;
    err.messages = messages;
    err.payload = data;
    throw err;
  }
  return data;
}

export default {
  // ---- Auth
  login: (body) =>
    request(PATHS.auth.login, { method: "POST", body: JSON.stringify(body) }),
  register: (body) =>
    request(PATHS.auth.register, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  forgot: (body) =>
    request(PATHS.auth.forgot, { method: "POST", body: JSON.stringify(body) }),
  reset: (body) =>
    request(PATHS.auth.reset, { method: "POST", body: JSON.stringify(body) }),

  // ---- Jobs
  listJobs: (q = "", page = 1, limit = 10) =>
    request(withQuery(PATHS.jobs, { q, page, limit })),
  getJob: (id) => request(`${PATHS.jobs}/${id}`),
  createJob: (body) =>
    request(PATHS.jobs, { method: "POST", body: JSON.stringify(body) }),
  updateJob: (id, body) =>
    request(`${PATHS.jobs}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteJob: (id) => request(`${PATHS.jobs}/${id}`, { method: "DELETE" }),

  // ---- Runs
  listRuns: (jobId, page = 1, limit = 10) =>
    request(withQuery(PATHS.runs, { jobId, page, limit })),

  // ---- Inspector
  /** POST /api/inspector/preview { cron, timezone, count, startAt? } */
  preview: async (cron, timezone, count = 5, startAt) => {
    const data = await request(PATHS.inspector.preview, {
      method: "POST",
      body: JSON.stringify({
        cron,
        timezone,
        count,
        ...(startAt ? { startAt } : {}),
      }),
    });

    const rows = Array.isArray(data?.occurrences) ? data.occurrences : [];
    // Try common fields; fallback to ISO from Date if number; else stringify
    const toStr = (o) =>
      (o &&
        (o.iso || o.local || o.utc || o.at || o.when || o.date || o.value)) ??
      (typeof o === "number"
        ? new Date(o).toISOString()
        : typeof o === "string"
        ? o
        : (() => {
            try {
              return JSON.stringify(o);
            } catch {
              return String(o);
            }
          })());

    return { next: rows.map(toStr) };
  },

  /** GET /api/inspector/job/:id?count= */
  previewJob: async (id, count = 10) => {
    const rel = withQuery(PATHS.inspector.jobPreview(id), { count });
    const data = await request(rel);
    const rows = Array.isArray(data?.occurrences) ? data.occurrences : [];
    const toStr = (o) =>
      (o &&
        (o.iso || o.local || o.utc || o.at || o.when || o.date || o.value)) ??
      (typeof o === "number"
        ? new Date(o).toISOString()
        : typeof o === "string"
        ? o
        : (() => {
            try {
              return JSON.stringify(o);
            } catch {
              return String(o);
            }
          })());
    return {
      job: data?.job,
      next: rows.map(toStr),
      warningsCount: data?.warningsCount ?? 0,
    };
  },
};
