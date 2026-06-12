// lib/email.ts — echter E-Mail-Versand via SMTP (nodemailer).
// Konfiguration über Umgebungsvariablen:
//   SMTP_HOST, SMTP_PORT (587), SMTP_USER, SMTP_PASS, SMTP_SECURE ("true" für 465)
//   MAIL_FROM (Absender, z. B. "HK Growth Operator <info@hkgrowth-operator.de>")
// Ohne SMTP-Konfiguration wird NICHT gesendet, sondern { sent:false, reason:"no-smtp" }
// zurückgegeben — der Aufrufer kann dann z. B. einen Entwurf vermerken.
import nodemailer from "nodemailer";

export type SendResult = { sent: boolean; reason?: string; messageId?: string };

export function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function mailFrom(): string {
  return process.env.MAIL_FROM || process.env.SMTP_USER || "info@hkgrowth-operator.de";
}

let transporter: nodemailer.Transporter | null = null;
function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

export async function sendMail(opts: { to: string; subject: string; html: string }): Promise<SendResult> {
  if (!smtpConfigured()) return { sent: false, reason: "no-smtp" };
  if (!opts.to || !opts.to.includes("@")) return { sent: false, reason: "no-recipient" };
  try {
    const info = await getTransporter().sendMail({
      from: mailFrom(),
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    return { sent: false, reason: (err as Error).message };
  }
}
