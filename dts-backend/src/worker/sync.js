import mongoose from "mongoose";
import Job from "../models/Job.js";
import { scheduleOne, unscheduleOne } from "./scheduler.js";

/**
 * Start watching Job collection for inserts/updates/deletes.
 * Requires Mongo replica set. Falls back to throwing if not supported.
 */
export async function startLiveSync(agenda) {
  const coll = mongoose.connection.collection("jobs"); // Mongoose pluralizes: Job -> jobs
  const pipeline = [
    {
      $match: {
        operationType: { $in: ["insert", "update", "replace", "delete"] },
      },
    },
  ];

  let stream;
  try {
    stream = coll.watch(pipeline, { fullDocument: "updateLookup" });
  } catch (err) {
    // Usually "The $changeStream stage is only supported on replica sets"
    throw Object.assign(
      new Error(
        "Change streams not available on this MongoDB (need replica set)."
      ),
      { cause: err }
    );
  }

  console.log("👂 Live sync (change streams) started");

  stream.on("change", async (change) => {
    try {
      if (change.operationType === "delete") {
        const jobId = change.documentKey?._id;
        await unscheduleOne(agenda, jobId);
        return;
      }

      // insert / update / replace
      const doc = change.fullDocument; // Job doc after change
      if (!doc) return;

      await scheduleOne(agenda, doc);
    } catch (e) {
      console.error("live sync error:", e.message);
    }
  });

  stream.on("error", (e) => {
    console.error("change stream error:", e);
  });

  return stream;
}
