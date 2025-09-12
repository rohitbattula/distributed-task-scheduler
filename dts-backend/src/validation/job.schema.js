import { z } from "zod";

const httpSchema = z
  .object({
    method: z
      .enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])
      .optional(),
    url: z.string().url().min(1, "url required for http").optional(),
    headers: z.record(z.string()).optional(),
    body: z.string().optional(),
    timeoutMs: z.number().int().min(1).max(120000).optional(),
    followRedirects: z.boolean().optional(),
    expectedStatus: z.array(z.number().int()).min(1).optional(),
  })
  .partial();

const scriptSchema = z
  .object({
    command: z.string().trim().min(1, "command required for script").optional(),
    args: z.array(z.string()).optional(),
    cwd: z.string().trim().optional(),
    env: z.record(z.string()).optional(),
    timeoutMs: z.number().int().min(1).max(300000).optional(),
    maxBufferKB: z.number().int().min(64).max(8192).optional(),
  })
  .partial();

export const createJobSchema = z
  .object({
    name: z.string().trim().min(1),
    type: z.enum(["http", "script"]),
    schedule: z.string().trim().min(1),
    timezone: z.string().trim().min(1).default("UTC"),
    // legacy
    target: z.string().trim().optional(),
    retries: z.number().int().min(0).default(0),
    backoffSec: z.number().int().min(0).default(60),
    paused: z.boolean().default(false),

    http: httpSchema.optional(),
    script: scriptSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "http") {
      const url = data.http?.url ?? data.target;
      if (!url)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "http.url (or legacy target) is required for type=http",
        });
    } else if (data.type === "script") {
      const cmd = data.script?.command ?? data.target;
      if (!cmd)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "script.command (or legacy target) is required for type=script",
        });
    }
  });

export const updateJobSchema = z.object({
  name: z.string().trim().min(1).optional(),
  type: z.enum(["http", "script"]).optional(), // generally shouldn’t change, but we allow
  schedule: z.string().trim().min(1).optional(),
  timezone: z.string().trim().min(1).optional(),
  target: z.string().trim().optional(),
  retries: z.number().int().min(0).optional(),
  backoffSec: z.number().int().min(0).optional(),
  paused: z.boolean().optional(),
  http: httpSchema.optional(),
  script: scriptSchema.optional(),
});
