import { Router } from "express";
import Job from "../models/Job.js";
import { isObjectId } from "../utils/isObjectId.js";
import { createJobSchema, updateJobSchema } from "../validation/job.schema.js";

const router = Router();

/**
 * POST /api/jobs
 * Create a job
 */
router.post("/", async (req, res, next) => {
  try {
    const parsed = createJobSchema.parse(req.body);

    // map legacy `target` to new shape
    if (parsed.type === "http") {
      parsed.http = parsed.http || {};
      if (!parsed.http.url && parsed.target) parsed.http.url = parsed.target;
      delete parsed.target;
    } else if (parsed.type === "script") {
      parsed.script = parsed.script || {};
      if (!parsed.script.command && parsed.target)
        parsed.script.command = parsed.target;
      delete parsed.target;
    }

    const job = await Job.create({ ...parsed, ownerId: req.user.id });
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/jobs
 * List jobs with optional filters + pagination
 * query: q (name contains), type, paused, page, limit
 */
router.get("/", async (req, res, next) => {
  try {
    const { q = "", type, paused, page = "1", limit = "20" } = req.query;

    const filter = { ownerId: req.user.id };
    if (q) filter.name = { $regex: String(q), $options: "i" };
    if (type) filter.type = type;
    if (paused !== undefined) filter.paused = paused === "true";

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Job.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Job.countDocuments(filter),
    ]);

    res.json({
      items,
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/jobs/:id
 * Get one job
 */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ message: "invalid id" });
    }
    const job = await Job.findOne({ _id: id, ownerId: req.user.id }).lean();
    if (!job) return res.status(404).json({ message: "job not found" });
    res.json(job);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/jobs/:id
 * Update allowed fields
 */
router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) return res.status(400).json({ message: "invalid id" });

    const parsed = updateJobSchema.parse(req.body);

    // legacy mapping on update too
    if (parsed.target) {
      if (
        parsed.type === "http" ||
        (!parsed.type && (parsed.http || !parsed.script))
      ) {
        parsed.http = parsed.http || {};
        parsed.http.url = parsed.http.url || parsed.target;
      } else if (
        parsed.type === "script" ||
        (!parsed.type && (parsed.script || !parsed.http))
      ) {
        parsed.script = parsed.script || {};
        parsed.script.command = parsed.script.command || parsed.target;
      }
      delete parsed.target;
    }

    const job = await Job.findOneAndUpdate(
      { _id: id, ownerId: req.user.id },
      { $set: parsed },
      { new: true, runValidators: true }
    );
    if (!job) return res.status(404).json({ message: "job not found" });
    res.json(job);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/jobs/:id/pause
 */
router.post("/:id/pause", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ message: "invalid id" });
    }
    const job = await Job.findOneAndUpdate(
      { _id: id, ownerId: req.user.id },
      { $set: { paused: true } },
      { new: true }
    );
    if (!job) return res.status(404).json({ message: "job not found" });
    res.json(job);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/jobs/:id/resume
 */
router.post("/:id/resume", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ message: "invalid id" });
    }
    const job = await Job.findOneAndUpdate(
      { _id: id, ownerId: req.user.id },
      { $set: { paused: false } },
      { new: true }
    );
    if (!job) return res.status(404).json({ message: "job not found" });
    res.json(job);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/jobs/:id
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) {
      return res.status(400).json({ message: "invalid id" });
    }
    const job = await Job.findOneAndDelete({ _id: id, ownerId: req.user.id });
    if (!job) return res.status(404).json({ message: "job not found" });
    res.json({ ok: true, deleted: job._id });
  } catch (err) {
    next(err);
  }
});

export default router;
