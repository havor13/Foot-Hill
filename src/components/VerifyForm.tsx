"use client";

import { useActionState } from "react";
import { resendCode, verifyCode, type FormState } from "@/app/(auth)/actions";
import SubmitButton from "@/components/SubmitButton";

export default function VerifyForm({ email }: { email: string }) {
  const [state, action] = useActionState<FormState, FormData>(verifyCode, {});
  const [resent, resend] = useActionState<FormState, FormData>(() => resendCode(), {});

  return (
    <div className="card grid gap-4 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="mt-1 text-sm text-muted">
          We sent a 6-digit code to <b className="text-ink">{email}</b>. It expires in 15 minutes.
        </p>
      </div>

      <form action={action} className="grid gap-3">
        <label className="label" htmlFor="code">
          Verification code
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            className="input text-center font-display text-2xl tracking-[0.4em]"
          />
        </label>
        <p role="alert" className="min-h-5 text-sm text-danger">
          {state.error}
        </p>
        <SubmitButton pendingText="Checking…">Confirm email</SubmitButton>
      </form>

      <form action={resend} className="grid gap-2 border-t border-line pt-4">
        <p className="text-sm text-muted">Did not get it? Check spam, then ask for a new code.</p>
        <p role="status" className={`min-h-5 text-sm ${resent.error ? "text-danger" : "text-accent"}`}>
          {resent.error ?? resent.message}
        </p>
        <SubmitButton className="btn" pendingText="Sending…">
          Send a new code
        </SubmitButton>
      </form>
    </div>
  );
}
