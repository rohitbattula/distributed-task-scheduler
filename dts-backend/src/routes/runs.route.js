import { Router } from "express";
import Run from "../models/Run.js";
import { isObjectId } from "../utils/isObjectId.js";

const router = Router();

/**
 * GET /api/runs
 * Query params:
 *   jobId?=...    filter by job
 *   status?=success|error
 *   page?=1       pagination
 *   limit?=20
 */
router.get("/", async (req, res, next) => {
  try {
    const { jobId, status, page = "1", limit = "20" } = req.query;

    const filter = { ownerId: req.user.id };
    if (jobId) {
      if (!isObjectId(jobId))
        return res.status(400).json({ message: "invalid jobId" });
      filter.job = jobId;
    }
    if (status) filter.status = status;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Run.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("job", "name type")
        .lean(),
      Run.countDocuments(filter),
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
 * GET /api/runs/:id
 * Fetch a single run
 */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isObjectId(id)) return res.status(400).json({ message: "invalid id" });

    const run = await Run.findOne({ _id: id, ownerId: req.user.id })
      .populate("job", "name type")
      .lean();
    if (!run) return res.status(404).json({ message: "run not found" });

    res.json(run);
  } catch (err) {
    next(err);
  }
});

export default router;
