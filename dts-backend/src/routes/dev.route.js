import { Router } from "express";
import Job from "../models/Job.js";
import Run from "../models/Run.js";
import { isObjectId } from "../utils/isObjectId.js";

const router = Router();

/**
 * POST /api/dev/seed-run
 * body: { jobId: string, status?: "success"|"error", logs?: string }
 */
router.post("/seed-run", async (req, res, next) => {
  try {
    const { jobId, status = "success", logs = "sample logs" } = req.body || {};
    if (!isObjectId(jobId))
      return res.status(400).json({ message: "invalid jobId" });

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "job not found" });

    const run = await Run.create({
      job: job._id,
      status,
      startedAt: new Date(),
      finishedAt: new Date(),
      logs,
      result:
        status === "success"
          ? { httpStatus: 200 }
          : { error: "simulated failure" },
    });

    res.status(201).json(run);
  } catch (err) {
    next(err);
  }
});

export default router;
