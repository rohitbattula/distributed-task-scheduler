import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUrl);
  console.log("✅ MongoDB connected");
}

export function dbState() {
  const map = ["disconnected", "connected", "connecting", "disconnecting"];
  return map[mongoose.connection.readyState] ?? "unknown";
}
