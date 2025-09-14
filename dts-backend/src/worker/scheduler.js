// dts-backend/src/worker/scheduler.js
/** normalize repeat registration for a single job */
export async function scheduleOne(agenda, j) {
  const data = { jobId: String(j._id), attempt: 0 };
  const unique = { name: "execute-job", "data.jobId": data.jobId };

  // remove any existing repeaters for this job id
  await agenda.cancel(unique);

  if (j.paused) {
    console.log(`⏸️  unscheduled (paused): ${j.name}`);
    return;
  }

  const aj = agenda
    .create("execute-job", data)
    .unique(unique)
    .repeatEvery(j.schedule, {
      timezone: j.timezone || "UTC",
      skipImmediate: true,
    });

  await aj.save();

  console.log(
    `🔄 synced schedule: ${j.name} — cron="${j.schedule}" tz="${
      j.timezone || "UTC"
    }"`
  );
}

/** fully unschedule a job by id (used for deletes) */
export async function unscheduleOne(agenda, jobId) {
  const unique = { name: "execute-job", "data.jobId": String(jobId) };
  const n = await agenda.cancel(unique);
  if (n > 0) console.log(`🗑️  removed ${n} agenda entries for job ${jobId}`);
}
