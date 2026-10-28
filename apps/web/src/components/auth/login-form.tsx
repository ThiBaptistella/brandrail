"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { Flash, FormControl, TextInput, cn } from "@brandrail/ui";
import { signInAction, type FormState } from "@/app/actions/auth";
import { SubmitButton } from "./submit-button";
import { PasswordInput } from "./password-input";
import { authInput } from "./auth-card";

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action] = useActionState<FormState, FormData>(signInAction, { error: initialError });

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.error && <Flash tone="danger">{state.error}</Flash>}
      <input type="hidden" name="next" value={next} />
      <FormControl label="Email" htmlFor="email">
        <TextInput
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          autoFocus
          required
          defaultValue={state.fields?.email}
          className={cn(authInput)}
        />
      </FormControl>
      <FormControl
        label="Password"
        htmlFor="password"
        trailing={
          <Link href="/forgot-password" className="text-[13px] text-fg-muted hover:text-fg">
            Forgot password?
          </Link>
        }
      >
        <PasswordInput id="password" name="password" autoComplete="current-password" placeholder="••••••••••" required />
      </FormControl>
      <SubmitButton variant="primary" size="xl" block pendingText="Signing in…" className="mt-2" trailingIcon={<ArrowRight size={16} />}>
        Sign in
      </SubmitButton>
    </form>
  );
}
