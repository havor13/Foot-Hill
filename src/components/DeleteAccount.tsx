"use client";

import { useActionState } from "react";
import { deleteAccount, type FormState } from "@/app/(auth)/actions";
import SubmitButton from "@/components/SubmitButton";

/** Two steps: open the panel, then type your password and DELETE. */
export default function DeleteAccount() {
  const [state, action] = useActionState<FormState, FormData>(deleteAccount, {});
  return (
    <details className="rounded-xl border border-line">
      <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-danger">Delete my account</summary>
      <form action={action} className="grid gap-3 border-t border-line p-3">
        <p className="text-sm">
          This permanently deletes your profile, posts, comments, reactions, messages, one-to-one chats and uploaded
          files. It cannot be undone. Course circles you created stay for the other members.
        </p>
        <label className="label" htmlFor="del-password">
          Your password
          <input id="del-password" name="password" type="password" autoComplete="current-password" required className="input" />
        </label>
        <label className="label" htmlFor="del-confirm">
          Type DELETE to confirm
          <input id="del-confirm" name="confirm" autoComplete="off" required className="input" />
        </label>
        <p role="alert" className="min-h-5 text-sm text-danger">
          {state.error}
        </p>
        <div>
          <SubmitButton pendingText="Deleting…" className="btn border-danger text-danger">
            Delete my account for good
          </SubmitButton>
        </div>
      </form>
    </details>
  );
}
