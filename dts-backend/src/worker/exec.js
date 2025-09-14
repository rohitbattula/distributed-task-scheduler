// dts-backend/src/worker/exec.js
import axios from "axios";
import { exec as _exec } from "child_process";
import { promisify } from "util";
const exec = promisify(_exec);

// -------- HTTP executor --------
export async function runHttp(http) {
  const method = (http?.method || "GET").toUpperCase();
  const url = http?.url;
  const headers = safeHeaders(http?.headers); // <-- sanitize here
  const body = http?.body;
  const timeout = Number(http?.timeoutMs ?? 15000);
  const follow = http?.followRedirects !== false; // default true
  const expected =
    Array.isArray(http?.expectedStatus) && http.expectedStatus.length
      ? http.expectedStatus
      : [200];

  if (!url) {
    return { ok: false, logs: "HTTP ERROR: missing url", result: null };
  }

  const t0 = Date.now();
  try {
    const resp = await axios.request({
      url,
      method,
      headers,
      data: body ?? undefined,
      timeout,
      maxRedirects: follow ? 5 : 0,
      validateStatus: () => true, // we'll judge ourselves
    });

    const ms = Date.now() - t0;
    const ok = expected.includes(resp.status);
    const textSample = toSample(resp.data);
    const logs = `HTTP ${resp.status} in ${ms}ms\n${textSample}`;

    return { ok, logs, result: { status: resp.status, data: resp.data } };
  } catch (err) {
    const ms = Date.now() - t0;
    const msg = err?.message || String(err);
    return { ok: false, logs: `HTTP ERROR in ${ms}ms: ${msg}`, result: null };
  }
}

// -------- Script executor --------
export async function runScript(script) {
  const cmd = script?.command;
  const args = Array.isArray(script?.args) ? script.args : [];
  const cwd = script?.cwd || process.cwd();
  const env = { ...process.env, ...(script?.env || {}) };
  const timeout = Number(script?.timeoutMs ?? 20000);
  const maxBuffer = Math.max(64, Number(script?.maxBufferKB ?? 1024)) * 1024;

  if (!cmd) {
    return { ok: false, logs: "SCRIPT ERROR: missing command", result: null };
  }

  const t0 = Date.now();
  try {
    // Use exec for simple commands; switch to spawn if you need streaming
    const full = [cmd, ...args.map(q)].join(" ");
    const { stdout, stderr } = await exec(full, {
      cwd,
      env,
      timeout,
      maxBuffer,
    });
    const ms = Date.now() - t0;
    const combined = [stdout, stderr].filter(Boolean).join("\n").slice(0, 4000);
    return {
      ok: true,
      logs: `SCRIPT ok in ${ms}ms\n${combined}`,
      result: { exitCode: 0 },
    };
  } catch (err) {
    const ms = Date.now() - t0;
    const combined =
      [err?.stdout, err?.stderr].filter(Boolean).join("\n") ||
      err?.message ||
      String(err);
    return {
      ok: false,
      logs: `SCRIPT ERROR in ${ms}ms\n${String(combined).slice(0, 4000)}`,
      result: { exitCode: err?.code ?? 1 },
    };
  }
}

// Helpers
function toSample(data) {
  if (typeof data === "string") return data.slice(0, 500);
  try {
    return JSON.stringify(data).slice(0, 500);
  } catch {
    return String(data).slice(0, 500);
  }
}
function q(s) {
  // naive quoting for args with spaces; good enough for dev
  return /\s/.test(String(s)) ? JSON.stringify(String(s)) : String(s);
}

// NEW: sanitize headers into { [string]: string } with no CR/LF
function safeHeaders(h) {
  if (!h || typeof h !== "object" || Array.isArray(h)) return {};
  const out = {};
  for (const [k0, v0] of Object.entries(h)) {
    const k = String(k0).trim();
    if (!k) continue;
    let v = v0;
    if (v == null) continue;
    if (Array.isArray(v)) v = v.join(","); // collapse arrays
    else if (typeof v === "object") {
      try {
        v = JSON.stringify(v);
      } catch {
        v = String(v);
      }
    }
    v = String(v).replace(/[\r\n]+/g, " "); // strip CR/LF
    out[k] = v;
  }
  return out;
}
