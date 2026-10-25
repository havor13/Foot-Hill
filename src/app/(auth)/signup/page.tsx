"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signup, type FormState } from "../actions";
import SubmitButton from "@/components/SubmitButton";

export default function SignupPage() {
  const [state, action] = useActionState<FormState, FormData>(signup, {});
  const [role, setRole] = useState<"STUDENT" | "ALUMNI">("STUDENT");

  return (
    <form action={action} className="card grid gap-4 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold">Join Foothill Commons</h1>
        <p className="mt-1 text-sm text-muted">
          Students join with a BYU email. We send a 6-digit code to confirm it.
        </p>
      </div>

      <fieldset className="grid grid-cols-2 gap-2">
        <legend className="sr-only">I am a</legend>
        {(["STUDENT", "ALUMNI"] as const).map((r) => (
          <label
            key={r}
            className={`cursor-pointer rounded-xl border px-3 py-2 text-center text-sm font-semibold ${role === r ? "border-accent bg-accent-soft text-accent" : "border-line text-muted"}`}
          >
            <input
              type="radio"
              name="role"
              value={r}
              checked={role === r}
              onChange={() => setRole(r)}
              className="sr-only"
            />
            {r === "STUDENT" ? "Current student" : "Alumni"}
          </label>
        ))}
      </fieldset>

      <label className="label" htmlFor="name">
        Full name
        <input id="name" name="name" autoComplete="name" required className="input" />
      </label>
      <label className="label" htmlFor="email">
        {role === "STUDENT" ? "BYU email" : "Email"}
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={role === "STUDENT" ? "name@byu.edu" : "you@example.com"}
          className="input"
        />
      </label>
      <label className="label" htmlFor="major">
        Major
        <input id="major" name="major" className="input" placeholder="For example, Nursing" />
      </label>
      {role === "ALUMNI" && (
        <label className="label" htmlFor="gradYear">
          Graduation year
          <input id="gradYear" name="gradYear" type="number" min={1950} max={2100} required className="input" />
        </label>
      )}
      <label className="label" htmlFor="password">
        Password
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className="input" />
        <span className="text-xs font-normal text-muted">At least 8 characters.</span>
      </label>

      {role === "ALUMNI" && (
        <p className="rounded-xl bg-sun-soft p-3 text-sm">
          Alumni profiles are reviewed before they appear in the directory, so students can trust who they are
          contacting.
        </p>
      )}

      <p role="alert" className="min-h-5 text-sm text-danger">
        {state.error}
      </p>
      <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
