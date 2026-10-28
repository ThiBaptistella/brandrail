"use client";

import { useActionState } from "react";
import { Flash, FormControl, TextInput } from "@brandrail/ui";
import { updatePasswordAction, type FormState } from "@/app/actions/auth";
import { SubmitButton } from "@/components/auth/submit-button";

export function PasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(updatePasswordAction, {});
  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      {state.error && <Flash tone="danger">{state.error}</Flash>}
      {state.message && <Flash tone="success">{state.message}</Flash>}
      <FormControl label="New password" htmlFor="new-password" caption="At least 10 characters.">
        <TextInput id="new-password" name="password" type="password" autoComplete="new-password" minLength={10} required />
      </FormControl>
      <div>
        <SubmitButton pendingText="Updating…">Update password</SubmitButton>
      </div>
    </form>
  );
}
