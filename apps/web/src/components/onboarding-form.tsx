"use client";

import { useActionState, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Flash, FormControl, TextInput, cn } from "@brandrail/ui";
import { createOrganizationAction } from "@/app/actions/org";
import type { FormState } from "@/app/actions/auth";
import { SubmitButton } from "./auth/submit-button";
import { authInput } from "./auth/auth-card";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 39);

export function OnboardingForm() {
  const [state, action] = useActionState<FormState, FormData>(createOrganizationAction, {});
  const [name, setName] = useState(state.fields?.name ?? "");
  const [slug, setSlug] = useState(state.fields?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.error && <Flash tone="danger">{state.error}</Flash>}
      <FormControl label="Organisation name" htmlFor="name" caption="Usually your company or brand name.">
        <TextInput
          id="name"
          name="name"
          autoFocus
          required
          placeholder="Acme Mining"
          className={authInput}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
      </FormControl>
      <FormControl label="Organisation URL" htmlFor="slug">
        <div className="flex items-stretch overflow-hidden rounded-md border border-btn-border bg-canvas-subtle focus-within:border-accent-emphasis focus-within:ring-2 focus-within:ring-accent-emphasis/25">
          <span className="flex items-center border-r border-btn-border px-3 text-sm text-fg-subtle">brandrail.dev/</span>
          <input
            id="slug"
            name="slug"
            required
            className={cn("w-full bg-transparent font-mono text-sm text-fg outline-none", authInput)}
            value={slug}
            placeholder="acme-mining"
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
          />
        </div>
      </FormControl>
      <SubmitButton variant="primary" size="xl" block pendingText="Creating…" className="mt-2" trailingIcon={<ArrowRight size={16} />}>
        Create organisation
      </SubmitButton>
    </form>
  );
}
