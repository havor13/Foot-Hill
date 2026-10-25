"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type FormState } from "../actions";
import SubmitButton from "@/components/SubmitButton";

export default function LoginPage() {
  const [state, action] = useActionState<FormState, FormData>(login, {});

  return (
    <form action={action} className="card grid gap-4 shadow-sm">
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <label className="label" htmlFor="email">
        BYU email
        <input id="email" name="email" type="email" autoComplete="email" required className="input" />
      </label>
      <label className="label" htmlFor="password">
        Password
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </label>
      <p role="alert" className="min-h-5 text-sm text-danger">
        {state.error}
      </p>
      <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
      <p className="text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-accent underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
