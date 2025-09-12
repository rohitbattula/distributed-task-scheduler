// src/routes/inspector.debug.route.js
import { Router } from "express";
import cronParserDefault from "cron-parser";
const { parseExpression } = cronParserDefault;
import moment from "moment-timezone";

const router = Router();

// GET /api/inspector/_debug?cron=0%202%20*%20*%20*&tz=America/Chicago&startAt=2025-03-08T00:00:00.000Z
router.get("/_debug", (req, res, next) => {
  try {
    const cron = String(req.query.cron || "0 2 * * *");
    const timezone = String(req.query.tz || "America/Chicago");
    const startAt = req.query.startAt
      ? new Date(String(req.query.startAt))
      : new Date();

    const it = parseExpression(cron, {
      currentDate: startAt,
      tz: timezone,
      iterator: true,
    });
    const { value } = it.next(); // Date
    const ts = value.getTime();

    const localFromTs = moment
      .tz(ts, timezone)
      .format("YYYY-MM-DD[T]HH:mm:ss.SSSZ"); // correct
    const localFromDate = moment(value)
      .tz(timezone)
      .format("YYYY-MM-DD[T]HH:mm:ss.SSSZ"); // also should be correct now
    const localNowWrong = moment()
      .tz(timezone)
      .format("YYYY-MM-DD[T]HH:mm:ss.SSSZ");

    res.json({
      cron,
      timezone,
      startAt: startAt.toISOString(),
      occurrenceUTC: new Date(ts).toISOString(),
      occurrenceEpochMs: ts,
      localFromTs,
      localFromDate,
      localNowWrong,
      sameTsVsNow: localFromTs === localNowWrong,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
