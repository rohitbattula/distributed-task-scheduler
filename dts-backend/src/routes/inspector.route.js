import { Router } from "express";
import { z } from "zod";
import { previewSchedule } from "../utils/inspector.js";

const router = Router();

const schema = z.object({
  cron: z.string().trim().min(1, "cron is required"),
  timezone: z.string().trim().min(1).default("UTC"),
  count: z.number().int().min(1).max(200).default(15),
  startAt: z.string().datetime().optional(), // ISO string
});

router.post("/preview", (req, res, next) => {
  try {
    const parsed = schema.parse(req.body || {});
    const startAt = parsed.startAt ? new Date(parsed.startAt) : new Date();

    const rows = previewSchedule({
      cron: parsed.cron,
      timezone: parsed.timezone,
      count: parsed.count,
      startAt,
    });

    res.json({
      cron: parsed.cron,
      timezone: parsed.timezone,
      startAt: startAt.toISOString(),
      count: rows.length,
      occurrences: rows,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
