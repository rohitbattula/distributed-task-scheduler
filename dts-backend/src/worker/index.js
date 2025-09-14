// dts-backend/src/worker/index.js
import Agenda from "agenda";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { defineAgendaJobs, registerAllSchedules } from "./jobs.js";
import { startLiveSync } from "./sync.js";

let liveStream;

async function main() {
  // Safety nets
  process.on("unhandledRejection", (r) => console.error("[UNHANDLED]", r));
  process.on("uncaughtException", (e) => console.error("[UNCAUGHT]", e));

  await mongoose.connect(env.mongoUrl);
  console.log("✅ Mongo connected (worker)");

  const agenda = new Agenda({
    db: { address: env.mongoUrl, collection: "agendaJobs" },
    processEvery: "5 seconds",
    defaultConcurrency: 5,
    maxConcurrency: 20,
    lockLimit: 50,
  });

  // Agenda lifecycle logs
  agenda.on("start", (job) =>
    console.log(`[AGENDA START] ${job.attrs.name}`, job.attrs.data)
  );
  agenda.on("success", (job) =>
    console.log(`[AGENDA OK] ${job.attrs.name}`, {
      nextRunAt: job.attrs.nextRunAt,
    })
  );
  agenda.on("fail", (err, job) =>
    console.error(
      `[AGENDA FAIL] ${job?.attrs?.name}`,
      job?.attrs?.data,
      err?.stack || err?.message || err
    )
  );

  // 1) Register job handlers
  defineAgendaJobs(agenda);

  // 2) Start Agenda FIRST so internal collection is ready
  await agenda.start();
  console.log("✅ Agenda started");

  // 3) Now it's safe to cancel/create repeaters
  await registerAllSchedules(agenda);

  // 4) Optional: live sync via change streams (Atlas supports this)
  try {
    liveStream = await startLiveSync(agenda);
    console.log("🔌 Live sync enabled (change streams).");
  } catch (e) {
    console.warn("⚠️ Live sync unavailable:", e?.message || e);
  }

  console.log("🚀 Worker started");

  // Graceful shutdown
  const stop = async () => {
    console.log("\nShutting down worker...");
    try {
      if (liveStream) await liveStream.close();
    } catch {}
    try {
      await agenda.stop();
    } catch {}
    try {
      await mongoose.connection.close();
    } catch {}
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((e) => {
  console.error("Worker failed to start:", e);
  process.exit(1);
});
