"use client";

import { useActionState, useState } from "react";
import { Flash, FormControl, TextInput } from "@brandrail/ui";
import { createOrganizationAction } from "@/app/actions/org";
import type { FormState } from "@/app/actions/auth";
import { SubmitButton } from "./auth/submit-button";

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
      <FormControl label="Organisation name" htmlFor="name" required caption="Usually your company or brand name.">
        <TextInput
          id="name"
          name="name"
          autoFocus
          required
          placeholder="Acme Mining"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
      </FormControl>
      <FormControl
        label="Organisation URL"
        htmlFor="slug"
        required
        caption={
          <>
            brandrail.dev/<strong className="text-fg">{slug || "your-org"}</strong>
          </>
        }
      >
        <TextInput
          id="slug"
          name="slug"
          required
          className="font-mono"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
        />
      </FormControl>
      <div className="flex items-center justify-end gap-3 border-t border-line pt-5">
        <SubmitButton variant="primary" pendingText="Creating…">
          Create organisation
        </SubmitButton>
      </div>
    </form>
  );
}
