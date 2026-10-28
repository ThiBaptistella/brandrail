"use client";

import { useActionState } from "react";
import { Flash, FormControl, TextInput } from "@brandrail/ui";
import { forgotPasswordAction, type FormState } from "@/app/actions/auth";
import { SubmitButton } from "./submit-button";

export function ForgotForm() {
  const [state, action] = useActionState<FormState, FormData>(forgotPasswordAction, {});
  if (state.message) return <Flash tone="success">{state.message}</Flash>;
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.error && <Flash tone="danger">{state.error}</Flash>}
      <p className="text-sm text-fg">Enter your account&apos;s email address and we&apos;ll send you a password reset link.</p>
      <FormControl label="Email address" htmlFor="email">
        <TextInput id="email" name="email" type="email" autoComplete="email" autoFocus required defaultValue={state.fields?.email} />
      </FormControl>
      <SubmitButton variant="primary" block pendingText="Sending…">
        Send password reset email
      </SubmitButton>
    </form>
  );
}
