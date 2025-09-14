// dts-backend/src/worker/jobs.js
import mongoose from "mongoose";
import Job from "../models/Job.js";
import Run from "../models/Run.js";
import { runHttp, runScript } from "./exec.js";

/**
 * Register job definitions with Agenda:
 *  - "execute-job"        (repeaters / cron)
 *  - "execute-job-once"   (retries / manual run)
 */
export function defineAgendaJobs(agenda) {
  agenda.define("execute-job", async (job) => {
    const { jobId, attempt = 0 } = job.attrs.data || {};
    if (!jobId || !mongoose.Types.ObjectId.isValid(jobId)) {
      console.warn("[execute-job] invalid jobId:", job.attrs.data);
      return;
    }

    const dbJob = await Job.findById(jobId);
    if (!dbJob) {
      console.warn("[execute-job] job not found, unscheduling:", jobId);
      try {
        await job.agenda.cancel({
          name: "execute-job",
          "data.jobId": String(jobId),
        });
      } catch (e) {
        console.warn("unschedule failed:", e.message);
      }
      return;
    }

    if (dbJob.paused) {
      console.log(`[execute-job] paused: ${dbJob.name}`);
      return;
    }

    const startedAt = new Date();

    // Execute job
    const execResult =
      dbJob.type === "http"
        ? await runHttp(dbJob.http || { url: dbJob.target }) // legacy fallback
        : await runScript(dbJob.script || { command: dbJob.target });

    const finishedAt = new Date();

    // Log the reason to console if it failed (helps you debug quickly)
    if (!execResult.ok) {
      console.error(
        `[execute-job] ${dbJob.name} failed:\n${(execResult.logs || "").slice(
          0,
          800
        )}`
      );
    }

    // Persist run (ownerId required by schema)
    await Run.create({
      ownerId: dbJob.ownerId,
      job: dbJob._id,
      status: execResult.ok ? "success" : "error",
      startedAt,
      finishedAt,
      logs: execResult.logs,
      result: execResult.result ?? null,
    });

    console.log(
      `[execute-job] ${dbJob.name} → ${execResult.ok ? "success" : "error"}`
    );

    // Retry with backoff if configured
    if (!execResult.ok && attempt < (dbJob.retries || 0)) {
      const retryDelayMs = Math.max((dbJob.backoffSec || 60) * 1000, 1000);
      await agenda.schedule(
        new Date(Date.now() + retryDelayMs),
        "execute-job-once",
        {
          jobId: String(dbJob._id),
          attempt: attempt + 1,
        }
      );
      console.log(
        `[retry] scheduled #${attempt + 1} for ${dbJob.name} in ${
          retryDelayMs / 1000
        }s`
      );
    }
  });

  // One-off runner (delegate to same logic)
  agenda.define("execute-job-once", async (job) => {
    const data = job.attrs.data || {};
    await agenda.now("execute-job", data);
  });
}

/**
 * Register repeating schedules for all jobs (skips paused).
 */
export async function registerAllSchedules(agenda) {
  const jobs = await Job.find({}).lean();
  for (const j of jobs) {
    const data = { jobId: String(j._id), attempt: 0 };
    const unique = { name: "execute-job", "data.jobId": data.jobId };

    // Clear any old/broken repeaters for this job
    await agenda.cancel(unique);

    if (j.paused) {
      console.log(`⏸️  unscheduled (paused): ${j.name}`);
      continue;
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
      `⏱️ scheduled: ${j.name} — cron="${j.schedule}" tz="${
        j.timezone || "UTC"
      }"`
    );
  }
}
