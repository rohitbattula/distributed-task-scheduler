// dts-backend/src/worker/sync.js
import mongoose from "mongoose";
import Job from "../models/Job.js";
import { scheduleOne, unscheduleOne } from "./scheduler.js";

/**
 * Start watching Job collection for inserts/updates/deletes.
 * Requires Mongo replica set (Atlas: yes).
 */
export async function startLiveSync(agenda) {
  const coll = mongoose.connection.collection("jobs"); // Job -> jobs
  const pipeline = [
    {
      $match: {
        operationType: { $in: ["insert", "update", "replace", "delete"] },
      },
    },
  ];

  const stream = coll.watch(pipeline, { fullDocument: "updateLookup" });

  stream.on("change", async (change) => {
    try {
      if (change.operationType === "delete") {
        const jobId = String(change.documentKey._id);
        await unscheduleOne(agenda, jobId);
        console.log("[SYNC] job deleted → unscheduled", jobId);
        return;
      }

      const doc =
        change.fullDocument || (await Job.findById(change.documentKey._id));
      if (!doc) return;

      await scheduleOne(agenda, doc);
      console.log("[SYNC] job upserted → (re)scheduled", String(doc._id));
    } catch (e) {
      console.error("live sync error:", e?.message || e);
    }
  });

  stream.on("error", (e) => {
    console.error("change stream error:", e);
  });

  return stream;
}
