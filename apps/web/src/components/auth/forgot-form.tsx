"use client";

import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { Flash, FormControl, TextInput } from "@brandrail/ui";
import { forgotPasswordAction, type FormState } from "@/app/actions/auth";
import { SubmitButton } from "./submit-button";
import { authInput } from "./auth-card";

export function ForgotForm() {
  const [state, action] = useActionState<FormState, FormData>(forgotPasswordAction, {});
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
      <FormControl label="Email" htmlFor="email">
        <TextInput id="email" name="email" type="email" autoComplete="email" placeholder="you@company.com" autoFocus required defaultValue={state.fields?.email} className={authInput} />
      </FormControl>
      <SubmitButton variant="primary" size="xl" block pendingText="Sending…" className="mt-2">
        Send reset link
      </SubmitButton>
    </form>
  );
}
