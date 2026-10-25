/**
 * Sends the verification code. Without RESEND_API_KEY (local development) the code is
 * printed to the server console so you can finish sign up without an email provider.
 */
export async function sendVerificationCode(to: string, code: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(`\n[Foothill Commons] Verification code for ${to}: ${code}\n`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Foothill Commons <no-reply@example.com>",
      to: [to],
      subject: "Your Foothill Commons code",
      text: `Your verification code is ${code}. It expires in 15 minutes.\n\nIf you did not create an account, you can ignore this email.`,
    }),
  });

  if (!res.ok) {
    console.error("Email provider rejected the verification email:", res.status, await res.text());
    throw new Error("Could not send the verification email.");
  }
}
