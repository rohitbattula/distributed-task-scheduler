import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcryptjs";

import User from "../models/User.js";
import ResetToken from "../models/ResetToken.js";
import { generateResetToken, minutesFromNow } from "../utils/resetToken.js";
import { sendMail } from "../services/mailer.js";

const router = Router();

// Lightweight rate-limit (per email) using in-memory map (dev only)
const recent = new Map(); // email -> timestamp ms
function throttle(email, windowMs = 60_000) {
  const last = recent.get(email) || 0;
  if (Date.now() - last < windowMs) return false;
  recent.set(email, Date.now());
  return true;
}

const forgotSchema = z.object({ email: z.string().email() });
router.post("/forgot", async (req, res, next) => {
  try {
    const { email } = forgotSchema.parse(req.body || {});
    if (!throttle(email, 60_000))
      return res
        .status(429)
        .json({ message: "Too many requests, try again shortly" });

    const user = await User.findOne({ email });
    // Respond 200 no matter what (don’t leak user existence)
    if (!user) return res.json({ ok: true });

    // Invalidate previous tokens (optional)
    await ResetToken.deleteMany({
      userId: user._id,
      usedAt: { $exists: false },
    });

    const { raw, hash } = generateResetToken();
    await ResetToken.create({
      userId: user._id,
      tokenHash: hash,
      expiresAt: minutesFromNow(30), // 30 minutes
    });

    const link = `${
      process.env.APP_URL || "http://localhost:5173"
    }/reset-password?token=${raw}`;
    const html = `
      <div style="font-family:system-ui">
        <h2>Password reset</h2>
        <p>Click the link below to reset your password. This link expires in 30 minutes.</p>
        <p><a href="${link}">${link}</a></p>
        <p>If you didn’t request this, you can ignore this email.</p>
      </div>
    `;

    await sendMail({ to: email, subject: "Reset your password", html });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(6),
});
router.post("/reset", async (req, res, next) => {
  try {
    const { token, password } = resetSchema.parse(req.body || {});
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const doc = await ResetToken.findOne({ tokenHash }).lean();
    if (!doc)
      return res.status(400).json({ message: "Invalid or expired token" });
    if (doc.usedAt)
      return res.status(400).json({ message: "Token already used" });
    if (new Date() > new Date(doc.expiresAt))
      return res.status(400).json({ message: "Token expired" });

    const passwordHash = await bcrypt.hash(password, 10);
    await Promise.all([
      // update user password
      User.updateOne({ _id: doc.userId }, { $set: { passwordHash } }),
      // mark token as used (single-use)
      ResetToken.updateOne({ _id: doc._id }, { $set: { usedAt: new Date() } }),
      // optional: invalidate other tokens for this user
      ResetToken.updateMany(
        {
          userId: doc.userId,
          _id: { $ne: doc._id },
          usedAt: { $exists: false },
        },
        { $set: { usedAt: new Date() } }
      ),
    ]);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
