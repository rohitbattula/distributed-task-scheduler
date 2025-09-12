import { Router } from "express";
import Job from "../models/Job.js";
import { isObjectId } from "../utils/isObjectId.js";
import { previewSchedule } from "../utils/inspector.js";

const router = Router();

router.get("/job/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const count = Math.min(parseInt(req.query.count ?? "10", 10) || 10, 200);
    if (!isObjectId(id)) return res.status(400).json({ message: "invalid id" });

    const job = await Job.findById(id).lean();
    if (!job) return res.status(404).json({ message: "job not found" });

    const occurrences = previewSchedule({
      cron: job.schedule,
      timezone: job.timezone || "UTC",
      count,
      startAt: new Date(), // now
    });

    const warnings = occurrences.filter((o) => o.transition);
    res.json({
      job: {
        _id: job._id,
        name: job.name,
        schedule: job.schedule,
        timezone: job.timezone,
      },
      count: occurrences.length,
      warningsCount: warnings.length,
      occurrences,
    });
  } catch (e) {
    e.status = 400;
    next(e);
  }
});

export default router;
