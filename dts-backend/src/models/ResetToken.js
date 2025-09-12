import mongoose from "mongoose";

const ResetTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: { type: String, required: true, index: true }, // SHA256 of token
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date }, // null until used
  },
  { timestamps: true }
);

// Optional TTL index (auto-clean after expiry + buffer)
ResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

export default mongoose.model("ResetToken", ResetTokenSchema);
