"use client";

import { useActionState, useState } from "react";
import { ArrowRight, MailCheck } from "lucide-react";
import { Flash, FormControl, TextInput, cn } from "@brandrail/ui";
import { signUpAction, type FormState } from "@/app/actions/auth";
import { SubmitButton } from "./submit-button";
import { PasswordInput } from "./password-input";
import { authInput } from "./auth-card";

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 10) s++;
  if (pw.length >= 14) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(4, s);
}
const labels = ["Too short", "Weak", "Okay", "Good", "Strong"];

export function SignupForm({ defaultEmail }: { defaultEmail?: string }) {
  const [state, action] = useActionState<FormState, FormData>(signUpAction, {});
  const [pw, setPw] = useState("");
  const s = strength(pw);

  if (state.message) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-subtle text-accent">
          <MailCheck size={22} />
        </span>
        <p className="text-[15px] text-fg">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.error && <Flash tone="danger">{state.error}</Flash>}
      <FormControl label="Full name" htmlFor="name">
        <TextInput id="name" name="name" autoComplete="name" placeholder="Jane Citizen" autoFocus required defaultValue={state.fields?.name} className={authInput} />
      </FormControl>
      <FormControl label="Work email" htmlFor="email">
        <TextInput
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
          defaultValue={state.fields?.email ?? defaultEmail}
          className={authInput}
        />
      </FormControl>
      <FormControl label="Password" htmlFor="password">
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 10 characters"
          required
          minLength={10}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        <div className="mt-1 flex items-center gap-3" aria-live="polite">
          <div className="flex flex-1 gap-1" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i < s ? (s <= 1 ? "bg-danger-emphasis" : s <= 2 ? "bg-attention" : "bg-brand") : "bg-line",
                )}
              />
            ))}
          </div>
          <span className="w-16 text-right text-xs text-fg-subtle">{pw ? labels[s] : ""}</span>
        </div>
      </FormControl>
      <SubmitButton variant="primary" size="xl" block pendingText="Creating account…" className="mt-2" trailingIcon={<ArrowRight size={16} />}>
        Create account
      </SubmitButton>
      <p className="text-center text-xs leading-5 text-fg-subtle">
        By continuing you agree to the Terms of Service and Privacy Policy.
      </p>
    </form>
  );
}
