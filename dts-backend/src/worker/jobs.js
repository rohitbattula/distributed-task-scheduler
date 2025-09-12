import Job from "../models/Job.js";
import Run from "../models/Run.js";
import { runHttp, runScript } from "./exec.js";
import mongoose from "mongoose";

/**
 * Register job definitions with Agenda.
 * We define two:
 *  - "execute-job": used for cron/repeat schedules
 *  - "execute-job-once": used for retries (one-off)
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
      console.warn("[execute-job] job not found:", jobId);
      return;
    }
    if (dbJob.paused) {
      console.log(`[execute-job] paused: ${dbJob.name}`);
      return;
    }

    const startedAt = new Date();
    let execResult;
    if (dbJob.type === "http") {
      const httpCfg = dbJob.http || { url: dbJob.target }; // fallback legacy
      execResult = await runHttp(httpCfg);
    } else {
      const scriptCfg = dbJob.script || { command: dbJob.target }; // fallback legacy
      execResult = await runScript(scriptCfg);
    }
    const finishedAt = new Date();

    await Run.create({
      ownerId: dbJob.ownerId,
      job: dbJob._id,
      status: execResult.ok ? "success" : "error",
      startedAt,
      finishedAt,
      logs: execResult.logs,
      result: execResult.result,
    });

    // Visible logs per fire
    console.log(
      `[execute-job] ${dbJob.name} → ${execResult.ok ? "success" : "error"}`
    );

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

  // Keep this simple: delegate to the same logic immediately
  agenda.define("execute-job-once", async (job) => {
    const data = job.attrs.data || {};
    await agenda.now("execute-job", data);
  });
}

/**
 * Register repeating schedules for all non-paused jobs.
 * Uses unique({ 'data.jobId': jobId }) to avoid duplicates across restarts.
 */
export async function registerAllSchedules(agenda) {
  const jobs = await Job.find({ paused: false }).lean();

  for (const j of jobs) {
    const data = { jobId: String(j._id), attempt: 0 };

    // Ensure uniqueness per job
    const unique = { name: "execute-job", "data.jobId": data.jobId };

    // Remove any broken/old repeaters for this job (safe in dev)
    await agenda.cancel(unique);

    // Create and persist a proper repeat job with timezone
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
