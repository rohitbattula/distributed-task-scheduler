// src/utils/inspector.js
import cronParserDefault from "cron-parser"; // CommonJS default
const { parseExpression } = cronParserDefault;
import moment from "moment-timezone";

/**
 * Generate next N fire times and annotate DST edge-cases.
 * Uses moment-timezone. Critically, we convert using the *timestamp* of the occurrence.
 */
export function previewSchedule({
  cron,
  timezone = "UTC",
  count = 10,
  startAt = new Date(),
}) {
  if (!moment.tz.zone(timezone)) {
    throw new Error(`Unknown/unsupported timezone: ${timezone}`);
  }

  const it = parseExpression(cron, {
    currentDate: startAt, // anchor
    tz: timezone, // ask cron-parser to iterate in this TZ
    iterator: true,
  });

  const rows = [];
  let prevOffset = null;

  for (let i = 0; i < count; i++) {
    const { value } = it.next(); // JS Date for occurrence (instant)
    const ts = value.getTime(); // <-- use epoch millis (defensive)
    const utcISO = new Date(ts).toISOString(); // normalized UTC ISO

    // Convert the *instant* into the requested zone using the timestamp
    // (avoids edge-cases where a Date object might carry hidden local assumptions)
    const local = moment.tz(ts, timezone); // <-- the key line

    if (!local.isValid()) {
      throw new Error(
        `Failed to render local time for ${utcISO} in ${timezone}`
      );
    }

    const offsetMin = local.utcOffset(); // e.g., -360 (CST) or -300 (CDT)

    let transition = null;
    let note = null;
    if (prevOffset !== null && offsetMin !== prevOffset) {
      const delta = offsetMin - prevOffset;
      if (delta === 60) {
        transition = "enter-DST";
        note = "skipped-hour (spring forward)";
      } else if (delta === -60) {
        transition = "exit-DST";
        note = "repeated-hour (fall back)";
      } else {
        transition = "offset-changed";
        note = `offset ${prevOffset}→${offsetMin} min`;
      }
    }

    rows.push({
      utc: utcISO,
      local: local.format("YYYY-MM-DD[T]HH:mm:ss.SSSZ"), // keep offset in string
      offsetMinutes: offsetMin,
      transition,
      note,
    });

    prevOffset = offsetMin;
  }

  return rows;
}
