import crypto from "crypto";

export function generateResetToken() {
  const raw = crypto.randomBytes(32).toString("hex"); // 64-char
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function minutesFromNow(min) {
  return new Date(Date.now() + min * 60 * 1000);
}
