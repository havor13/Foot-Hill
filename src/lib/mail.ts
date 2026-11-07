import nodemailer from "nodemailer";

const SUBJECT = "Your Foothill Commons code";

const textBody = (code: string) =>
  `Your verification code is ${code}. It expires in 15 minutes.\n\nIf you did not create an account, you can ignore this email.`;

const htmlBody = (code: string) =>
  `<div style="font-family:Arial,sans-serif;font-size:16px;color:#1b2a2a">
  <p>Your Foothill Commons verification code is:</p>
  <p style="font-size:32px;letter-spacing:8px;font-weight:bold;margin:12px 0">${code}</p>
  <p>It expires in 15 minutes. If you did not create an account, you can ignore this email.</p>
</div>`;

/**
 * Sends the verification code. Providers, in order of preference:
 *   1. Resend      when RESEND_API_KEY is set (best delivery, needs a verified domain)
 *   2. Gmail SMTP  when GMAIL_USER and GMAIL_APP_PASSWORD are set (free, about 500 emails a day)
 *   3. Console     otherwise, so local development works without any email account
 */
export async function sendVerificationCode(to: string, code: string): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "Foothill Commons <no-reply@example.com>",
        to: [to],
        subject: SUBJECT,
        text: textBody(code),
        html: htmlBody(code),
      }),
    });
    if (!res.ok) {
      console.error("Email provider rejected the verification email:", res.status, await res.text());
      throw new Error("Could not send the verification email.");
    }
    return;
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  if (gmailUser && gmailPass) {
    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: gmailPass },
    });
    try {
      await transport.sendMail({
        from: `"Foothill Commons" <${gmailUser}>`,
        to,
        subject: SUBJECT,
        text: textBody(code),
        html: htmlBody(code),
      });
    } catch (e) {
      console.error("Gmail rejected the verification email:", e instanceof Error ? e.message : e);
      throw new Error("Could not send the verification email.");
    }
    return;
  }

  console.log(`\n[Foothill Commons] Verification code for ${to}: ${code}\n`);
}
