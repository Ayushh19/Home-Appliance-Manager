import nodemailer from 'nodemailer';
import { config } from '../config.js';

// Without SMTP_URL (development), messages are rendered to JSON and printed instead of sent.
const transport = config.smtpUrl ? nodemailer.createTransport(config.smtpUrl) : nodemailer.createTransport({ jsonTransport: true });

export async function sendEmail(message: { to: string; subject: string; text: string }): Promise<void> {
  const info = await transport.sendMail({ from: config.mailFrom, ...message });
  if (!config.smtpUrl) {
    console.log(`[email] To: ${message.to}\n[email] Subject: ${message.subject}\n${message.text.replace(/^/gm, '[email]   ')}`);
  } else {
    console.log(`[email] sent to ${message.to}: ${info.messageId}`);
  }
}
