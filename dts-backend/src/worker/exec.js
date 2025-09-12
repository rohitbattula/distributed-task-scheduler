import axios from "axios";
import { exec as _exec } from "child_process";
import { promisify } from "util";
const exec = promisify(_exec);

export async function runHttp(http) {
  const method = (http?.method || "GET").toUpperCase();
  const url = http?.url;
  const headers = http?.headers || {};
  const body = http?.body;
  const timeout = Number(http?.timeoutMs ?? 15000);
  const follow = http?.followRedirects !== false; // default true
  const expected =
    Array.isArray(http?.expectedStatus) && http.expectedStatus.length
      ? http.expectedStatus
      : [200];

  const t0 = Date.now();
  try {
    const resp = await axios.request({
      method,
      url,
      headers,
      data: body ? tryParseJSON(body) ?? body : undefined,
      timeout,
      maxRedirects: follow ? 5 : 0,
      validateStatus: () => true, // we judge ourselves
    });

    const ms = Date.now() - t0;
    const ok = expected.includes(resp.status);
    return {
      ok,
      logs: `HTTP ${resp.status} ${
        ok ? "✓" : "✗ expected in [" + expected.join(",") + "]"
      } in ${ms}ms`,
      result: {
        status: resp.status,
        headers: resp.headers,
        bodySample: toSample(resp.data),
      },
    };
  } catch (err) {
    const ms = Date.now() - t0;
    return {
      ok: false,
      logs: `HTTP error after ${ms}ms: ${err.message}`,
      result: { error: err.stack?.slice(0, 1200) || String(err) },
    };
  }
}

export async function runScript(script) {
  const cmd = script?.command;
  const args = Array.isArray(script?.args) ? script.args : [];
  const cwd = script?.cwd || process.cwd();
  const env = { ...process.env, ...(script?.env || {}) };
  const timeout = Number(script?.timeoutMs ?? 20000);
  const maxBuffer = Math.max(64, Number(script?.maxBufferKB ?? 1024)) * 1024;

  const t0 = Date.now();
  try {
    // Use one string for exec; if you prefer spawn, we can switch later
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
    const combined = [err.stdout, err.stderr]
      .filter(Boolean)
      .join("\n")
      .slice(0, 4000);
    return {
      ok: false,
      logs: `SCRIPT failed in ${ms}ms (code=${err.code})\n${combined}`,
      result: { exitCode: err.code ?? -1, error: err.message },
    };
  }
}

// helpers
function tryParseJSON(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
function toSample(data) {
  if (typeof data === "string") return data.slice(0, 500);
  try {
    return JSON.stringify(data).slice(0, 500);
  } catch {
    return String(data).slice(0, 500);
  }
}
function q(s) {
  // naive quoting for args with spaces; fine for dev
  return /\s/.test(s) ? JSON.stringify(s) : s;
}
