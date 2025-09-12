import Agenda from "agenda";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { defineAgendaJobs, registerAllSchedules } from "./jobs.js";
import { startLiveSync } from "./sync.js";

let liveStream;

async function main() {
  await mongoose.connect(env.mongoUrl);
  console.log("✅ Mongo connected (worker)");

  const agenda = new Agenda({
    db: { address: env.mongoUrl, collection: "agendaJobs" },
    processEvery: "5 seconds",
    defaultConcurrency: 5,
    maxConcurrency: 20,
    lockLimit: 20,
  });

  defineAgendaJobs(agenda);

  agenda.on("ready", async () => {
    console.log("✅ Agenda ready");

    // initial sync of all non-paused jobs
    await registerAllSchedules(agenda);

    // start live sync (change streams)
    try {
      liveStream = await startLiveSync(agenda);
    } catch (e) {
      console.warn(
        "⚠️ Live sync unavailable (change streams). Consider enabling replica set or use polling fallback.\n",
        e.message
      );
    }

    await agenda.start();
    console.log("🚀 Worker started");
  });

  const stop = async () => {
    console.log("\nShutting down worker...");
    try {
      liveStream && (await liveStream.close());
    } catch {}
    await agenda.stop();
    await mongoose.connection.close();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

main().catch((e) => {
  console.error("Worker failed to start:", e);
  process.exit(1);
});
