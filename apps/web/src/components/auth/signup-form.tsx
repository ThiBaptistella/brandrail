"use client";

import { useActionState, useState } from "react";
import { Flash, FormControl, TextInput, cn } from "@brandrail/ui";
import { signUpAction, type FormState } from "@/app/actions/auth";
import { SubmitButton } from "./submit-button";

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 10) s++;
  if (pw.length >= 14) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}

export function SignupForm({ defaultEmail }: { defaultEmail?: string }) {
  const [state, action] = useActionState<FormState, FormData>(signUpAction, {});
  const [pw, setPw] = useState("");
  const s = strength(pw);

  if (state.message) {
    return <Flash tone="success">{state.message}</Flash>;
  }

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.error && <Flash tone="danger">{state.error}</Flash>}
      <FormControl label="Full name" htmlFor="name">
        <TextInput id="name" name="name" autoComplete="name" autoFocus required defaultValue={state.fields?.name} />
      </FormControl>
      <FormControl label="Work email" htmlFor="email">
        <TextInput
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.fields?.email ?? defaultEmail}
        />
      </FormControl>
      <FormControl label="Password" htmlFor="password" caption="At least 10 characters. A passphrase works well.">
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <div className="flex gap-1" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full",
                i < s ? (s <= 1 ? "bg-danger-emphasis" : s <= 2 ? "bg-attention" : "bg-success-emphasis") : "bg-line",
              )}
            />
          ))}
        </div>
      </FormControl>
      <SubmitButton variant="primary" block pendingText="Creating account…">
        Create account
      </SubmitButton>
      <p className="text-xs text-fg-muted">
        By creating an account you agree to the Terms of Service and Privacy Policy.
      </p>
    </form>
  );
}
