// src/app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import healthRoute from "./routes/health.route.js";
import { notFound, errorHandler } from "./middleware/error.js";
import testRoute from "./routes/test.route.js";
import jobsRoute from "./routes/jobs.route.js";
import runsRoute from "./routes/runs.route.js";
import devRoute from "./routes/dev.route.js";
import inspectorRoute from "./routes/inspector.route.js";
import inspectorDebugRoute from "./routes/inspector.debug.route.js";
import inspectorJobRoute from "./routes/inspector.job.route.js";
import authRoute from "./routes/auth.route.js";
import { requireAuth } from "./middleware/requireAuth.js";
import passwordRoute from "./routes/password.route.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

// ---- Rate limit ----
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, slow down (dev limit)." },
});

app.use("/api", apiLimiter);

app.use("/api/health", healthRoute);
app.use("/api/test", testRoute);
app.use("/api/jobs", requireAuth, jobsRoute);
app.use("/api/runs", requireAuth, runsRoute);
app.use("/api/dev", devRoute);
app.use("/api/inspector", inspectorRoute);
app.use("/api/inspector", inspectorDebugRoute);
app.use("/api/inspector", requireAuth, inspectorJobRoute);
app.use("/api/auth", authRoute);
app.use("/api/auth", passwordRoute);

app.use(notFound);
app.use(errorHandler);

export default app;
