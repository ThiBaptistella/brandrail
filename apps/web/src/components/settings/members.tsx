"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Mail, X } from "lucide-react";
import { Avatar, Box, BoxHeader, BoxRow, Button, Flash, Label, Select, TextInput } from "@brandrail/ui";
import { inviteMemberAction, removeMemberAction, revokeInviteAction, setMemberRoleAction, type ActionResult } from "@/app/actions/org";
import type { InvitationRow, MemberRow } from "@/lib/data";
import type { Role } from "@/lib/session";

const ROLE_HELP: Record<Role, string> = {
  owner: "Everything, including deleting the organisation",
  admin: "Edit the Brand Kit, registry and members",
  member: "Run checks and scans, create API keys",
  viewer: "Read only; read-only API keys for AI tools",
};

export function Members({
  members,
  invitations,
  me,
  myRole,
  signupUrl,
}: {
  members: MemberRow[];
  invitations: InvitationRow[];
  me: string;
  myRole: Role;
  signupUrl: string;
}) {
  const isAdmin = myRole === "owner" || myRole === "admin";
  const isOwner = myRole === "owner";
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const run = (fn: () => Promise<ActionResult>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      setResult(r);
      if (r.ok) after?.();
    });

  const roleOptions = (current: Role): Role[] => (isOwner ? ["owner", "admin", "member", "viewer"] : current === "owner" ? ["owner"] : ["admin", "member", "viewer"]);

  return (
    <div className="flex flex-col gap-4">
      {result && !result.ok && <Flash tone="danger">{result.error}</Flash>}
      {result?.ok && result.message && <Flash tone="success">{result.message}</Flash>}

      <Box>
        <BoxHeader>
          <h3 className="text-[13px] font-medium text-fg">{members.length} member{members.length === 1 ? "" : "s"}</h3>
        </BoxHeader>
        {members.map((m) => {
          const self = m.userId === me;
          const editable = isAdmin && !self && (isOwner || m.role !== "owner");
          return (
            <BoxRow key={m.userId} className="flex flex-wrap items-center gap-3">
              <Avatar name={m.name} size={32} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-fg">
                  {m.name} {self && <span className="font-normal text-fg-muted">(you)</span>}
                </div>
                <div className="truncate text-xs text-fg-muted">{m.email}</div>
              </div>
              {editable ? (
                <div className="w-32">
                  <Select aria-label={`Role for ${m.email}`} value={m.role} disabled={pending} onChange={(e) => run(() => setMemberRoleAction(m.userId, e.target.value as Role))} className="h-8 text-xs" title={ROLE_HELP[m.role]}>
                    {roleOptions(m.role).map((r) => (
                      <option key={r} value={r}>{r[0]!.toUpperCase() + r.slice(1)}</option>
                    ))}
                  </Select>
                </div>
              ) : (
                <Label title={ROLE_HELP[m.role]}>{m.role}</Label>
              )}
              {(editable || self) &&
                (confirm === m.userId ? (
                  <span className="flex items-center gap-1">
                    <Button size="sm" variant="danger" disabled={pending} onClick={() => run(() => removeMemberAction(m.userId), () => setConfirm(null))}>
                      {self ? "Leave" : "Remove"}
                    </Button>
                    <Button size="sm" variant="invisible" onClick={() => setConfirm(null)} aria-label="Cancel">
                      <X size={14} />
                    </Button>
                  </span>
                ) : (
                  <Button size="sm" variant="invisible" onClick={() => setConfirm(m.userId)}>
                    {self ? "Leave" : "Remove"}
                  </Button>
                ))}
            </BoxRow>
          );
        })}

        {isAdmin && (
          <BoxRow className="bg-canvas-subtle">
            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                run(() => inviteMemberAction(email, role), () => setEmail(""));
              }}
            >
              <div className="min-w-0 flex-1">
                <TextInput type="email" required placeholder="colleague@company.com" aria-label="Invite by email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="sm:w-32">
                <Select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </Select>
              </div>
              <Button type="submit" className="shrink-0" leadingIcon={<Mail size={14} />} disabled={pending || !email}>
                Invite
              </Button>
            </form>
            <p className="mt-2 text-xs text-fg-muted">{ROLE_HELP[role]}. No email is sent: share the sign-up link below; the invitation appears when they sign in with that address.</p>
          </BoxRow>
        )}
      </Box>

      {isAdmin && invitations.length > 0 && (
        <Box>
          <BoxHeader>
            <h3 className="text-[13px] font-medium text-fg">Pending invitations</h3>
          </BoxHeader>
          {invitations.map((i) => {
            const link = `${signupUrl}?email=${encodeURIComponent(i.email)}`;
            return (
              <BoxRow key={i.id} className="flex flex-wrap items-center gap-3">
                <Mail size={15} className="text-fg-subtle" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] text-fg">{i.email}</div>
                  <div className="text-xs text-fg-muted">Expires {new Date(i.expiresAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</div>
                </div>
                <Label>{i.role}</Label>
                <Button
                  size="sm"
                  variant="invisible"
                  leadingIcon={copied === i.id ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                  onClick={async () => {
                    await navigator.clipboard.writeText(link);
                    setCopied(i.id);
                    setTimeout(() => setCopied(null), 1500);
                  }}
                >
                  Copy sign-up link
                </Button>
                <Button size="sm" variant="invisible" disabled={pending} onClick={() => run(() => revokeInviteAction(i.id))}>
                  Revoke
                </Button>
              </BoxRow>
            );
          })}
        </Box>
      )}
    </div>
  );
}
