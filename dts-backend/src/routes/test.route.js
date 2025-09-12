import { Router } from "express";
import Job from "../models/Job.js";

const router = Router();

// POST /api/test/job — quick-create a dummy job
router.post("/job", async (req, res, next) => {
  try {
    const job = await Job.create({
      name: "ping-google",
      type: "http",
      schedule: "0 12 * * *",
      target: "https://google.com",
    });
    res.json(job);
  } catch (err) {
    next(err);
  }
});

// GET /api/test/jobs — list all jobs
router.get("/jobs", async (_req, res, next) => {
  try {
    const jobs = await Job.find().lean();
    res.json(jobs);
  } catch (err) {
    next(err);
  }
});

export default router;
