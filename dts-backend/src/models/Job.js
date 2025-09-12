import mongoose from "mongoose";

const HttpSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"],
      default: "GET",
    },
    url: { type: String, trim: true }, // required for type=http
    headers: { type: Map, of: String, default: {} }, // e.g., { "Authorization": "Bearer ..." }
    body: { type: String, default: "" }, // raw body (JSON/text)
    timeoutMs: { type: Number, default: 15000 },
    followRedirects: { type: Boolean, default: true },
    expectedStatus: { type: [Number], default: [200] }, // list of acceptable statuses
  },
  { _id: false }
);

const ScriptSchema = new mongoose.Schema(
  {
    command: { type: String, trim: true }, // required for type=script
    args: { type: [String], default: [] },
    cwd: { type: String, trim: true }, // optional working dir
    env: { type: Map, of: String, default: {} }, // allowlisted env vars
    timeoutMs: { type: Number, default: 20000 },
    maxBufferKB: { type: Number, default: 1024 }, // 1MB
  },
  { _id: false }
);

const JobSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["http", "script"], required: true },
    schedule: { type: String, required: true }, // cron
    timezone: { type: String, default: "UTC" },
    // legacy fields (for backward compat): target, retries/backoff/paused stay
    target: { type: String, trim: true }, // legacy; will be mapped if provided
    retries: { type: Number, default: 0 },
    backoffSec: { type: Number, default: 60 },
    paused: { type: Boolean, default: false },

    http: { type: HttpSchema, default: undefined },
    script: { type: ScriptSchema, default: undefined },
  },
  { timestamps: true }
);

export default mongoose.model("Job", JobSchema);
