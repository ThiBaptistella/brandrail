"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Flash, FormControl, TextInput } from "@brandrail/ui";
import { signInAction, type FormState } from "@/app/actions/auth";
import { SubmitButton } from "./submit-button";

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action] = useActionState<FormState, FormData>(signInAction, { error: initialError });

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.error && <Flash tone="danger">{state.error}</Flash>}
      <input type="hidden" name="next" value={next} />
      <FormControl label="Email address" htmlFor="email">
        <TextInput id="email" name="email" type="email" autoComplete="email" autoFocus required defaultValue={state.fields?.email} />
      </FormControl>
      <FormControl
        label="Password"
        htmlFor="password"
        trailing={
          <Link href="/forgot-password" className="text-xs text-accent hover:underline">
            Forgot password?
          </Link>
        }
      >
        <TextInput id="password" name="password" type="password" autoComplete="current-password" required />
      </FormControl>
      <SubmitButton variant="primary" block pendingText="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
