import nodemailer from "nodemailer";
import "dotenv/config";

let transporter;

export async function getTransporter() {
  if (transporter) return transporter;

  const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS } = process.env;
  if (MAIL_HOST && MAIL_USER && MAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: MAIL_HOST,
      port: Number(MAIL_PORT || 587),
      secure: false,
      auth: { user: MAIL_USER, pass: MAIL_PASS },
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, html }) {
  const from = process.env.MAIL_FROM || "no-reply@dts.dev";
  const t = await getTransporter();
  const info = await t.sendMail({ from, to, subject, html });
  const preview = nodemailer.getTestMessageUrl?.(info);
  if (preview) console.log("✉️  Email preview:", preview);
  return { messageId: info.messageId, previewUrl: preview || null };
}
