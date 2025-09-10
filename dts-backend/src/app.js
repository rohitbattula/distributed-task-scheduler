// src/app.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import healthRoute from "./routes/health.route.js";
import { notFound, errorHandler } from "./middleware/error.js";

const app = express();

app.use(cors());
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

app.use(notFound);
app.use(errorHandler);

export default app;
