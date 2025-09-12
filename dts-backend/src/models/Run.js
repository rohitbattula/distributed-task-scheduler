import mongoose from "mongoose";

const RunSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // NEW
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    status: { type: String, enum: ["success", "error"], required: true },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date },
    logs: { type: String },
    result: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

RunSchema.index({ ownerId: 1, job: 1, createdAt: -1 });
RunSchema.index({ ownerId: 1, status: 1, createdAt: -1 });

export default mongoose.model("Run", RunSchema);
