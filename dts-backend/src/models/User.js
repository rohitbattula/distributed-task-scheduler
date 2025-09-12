import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });

export default mongoose.model("User", UserSchema);
