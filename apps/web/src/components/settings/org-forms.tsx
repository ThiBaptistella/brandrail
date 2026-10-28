"use client";

import { useActionState, useState, useTransition } from "react";
import { Box, BoxRow, Button, Flash, FormControl, TextInput } from "@brandrail/ui";
import type { FormState } from "@/app/actions/auth";
import { deleteOrgAction, updateOrgAction, updateProfileAction } from "@/app/actions/org";
import { SubmitButton } from "@/components/auth/submit-button";

export function OrgForm({ name, slug, canEdit }: { name: string; slug: string; canEdit: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(updateOrgAction, { fields: { name, slug } });
  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      {state.error && <Flash tone="danger">{state.error}</Flash>}
      {state.message && <Flash tone="success">{state.message}</Flash>}
      <FormControl label="Organisation name" htmlFor="org-name">
        <TextInput id="org-name" name="name" defaultValue={state.fields?.name ?? name} disabled={!canEdit} required minLength={2} maxLength={80} />
      </FormControl>
      <FormControl label="URL slug" htmlFor="org-slug" caption="Lowercase letters, numbers and dashes. Shown in AI rule files.">
        <TextInput id="org-slug" name="slug" defaultValue={state.fields?.slug ?? slug} disabled={!canEdit} className="font-mono" required pattern="[a-z0-9][a-z0-9-]{0,37}[a-z0-9]?" />
      </FormControl>
      {canEdit ? (
        <div>
          <SubmitButton pendingText="Saving…">Save</SubmitButton>
        </div>
      ) : (
        <p className="text-xs text-fg-muted">Only owners and admins can change these.</p>
      )}
    </form>
  );
}

export function ProfileForm({ name, email }: { name: string; email: string }) {
  const [state, action] = useActionState<FormState, FormData>(updateProfileAction, { fields: { name } });
  return (
    <form action={action} className="flex max-w-md flex-col gap-4">
      {state.error && <Flash tone="danger">{state.error}</Flash>}
      {state.message && <Flash tone="success">{state.message}</Flash>}
      <FormControl label="Display name" htmlFor="p-name">
        <TextInput id="p-name" name="name" defaultValue={state.fields?.name ?? name} required maxLength={80} autoComplete="name" />
      </FormControl>
      <FormControl label="Email" htmlFor="p-email" caption="Invitations are matched to this address.">
        <TextInput id="p-email" value={email} disabled readOnly />
      </FormControl>
      <div>
        <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
      </div>
    </form>
  );
}

export function DangerZone({ slug, isOwner }: { slug: string; isOwner: boolean }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <Box className="border-danger/50">
      <BoxRow className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-medium text-fg">Delete this organisation</div>
          <div className="text-sm text-fg-muted">Removes the Brand Kit, component registry, all scans and API keys. This can&apos;t be undone.</div>
        </div>
        <Button variant="danger" disabled={!isOwner} onClick={() => setOpen(true)} title={isOwner ? undefined : "Only owners can delete the organisation"}>
          Delete organisation
        </Button>
      </BoxRow>
      {open && (
        <BoxRow className="flex flex-col gap-3 bg-danger-subtle/40">
          {error && <Flash tone="danger">{error}</Flash>}
          <FormControl label={`Type “${slug}” to confirm`} htmlFor="confirm-slug">
            <TextInput id="confirm-slug" value={typed} onChange={(e) => setTyped(e.target.value)} className="max-w-sm font-mono" autoFocus autoComplete="off" />
          </FormControl>
          <div className="flex gap-2">
            <Button
              variant="danger"
              disabled={typed.trim() !== slug || pending}
              onClick={() =>
                start(async () => {
                  const r = await deleteOrgAction(typed);
                  if (r && !r.ok) setError(r.error);
                })
              }
            >
              {pending ? "Deleting…" : "I understand, delete it"}
            </Button>
            <Button variant="invisible" onClick={() => (setOpen(false), setTyped(""), setError(null))}>
              Cancel
            </Button>
          </div>
        </BoxRow>
      )}
    </Box>
  );
}
