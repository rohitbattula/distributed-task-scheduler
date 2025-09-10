import { Router } from "express";
import { dbState } from "../config/db.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "dts-backend",
    time: new Date().toISOString(),
    uptimeSec: process.uptime(),
    db: dbState(),
  });
});

export default router;
