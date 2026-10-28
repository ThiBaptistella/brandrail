import type { Metadata } from "next";
import { Avatar, Box, Label } from "@brandrail/ui";
import { DangerZone, OrgForm, ProfileForm } from "@/components/settings/org-forms";
import { Members } from "@/components/settings/members";
import { PasswordForm } from "@/components/settings/password-form";
import { listInvitations, listMembers } from "@/lib/data";
import { SITE_URL } from "@/lib/env";
import { canAdmin, requireOrg } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

const nav = [
  { id: "general", label: "General" },
  { id: "members", label: "Members" },
  { id: "profile", label: "Your profile" },
  { id: "password", label: "Password" },
  { id: "billing", label: "Plan" },
  { id: "danger", label: "Danger zone" },
];

function Section({ id, title, children, description }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="border-b border-line pb-2 text-xl font-normal text-fg">{title}</h2>
      {description && <p className="mt-2 text-sm text-fg-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const { user, org } = await requireOrg();
  const [members, invitations] = await Promise.all([listMembers(org, user), listInvitations(org)]);

  return (
    <div className="grid gap-8 md:grid-cols-[220px_1fr]">
      <aside className="md:sticky md:top-20 md:self-start">
        <div className="mb-4 flex items-center gap-2">
          <Avatar name={org.name} size={32} square />
          <div className="min-w-0">
            <div className="truncate font-medium text-fg">{org.name}</div>
            <div className="text-xs text-fg-muted">You&apos;re {org.role === "admin" || org.role === "owner" ? "an" : "a"} {org.role}</div>
          </div>
        </div>
        <nav className="flex flex-col gap-0.5 max-md:flex-row max-md:overflow-x-auto">
          {nav.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="rounded-md px-3 py-1.5 text-sm whitespace-nowrap text-fg hover:bg-btn-hover">
              {n.label}
            </a>
          ))}
        </nav>
      </aside>

      <div className="flex max-w-3xl min-w-0 flex-col gap-10">
        <Section id="general" title="General">
          <OrgForm name={org.name} slug={org.slug} canEdit={canAdmin(org)} />
        </Section>

        <Section id="members" title="Members" description="Owners and admins edit the Brand Kit and members. Members run checks and create API keys. Viewers can read and use AI tools.">
          <Members members={members} invitations={invitations} me={user.id} myRole={org.role} signupUrl={`${SITE_URL.replace(/\/$/, "")}/signup`} />
        </Section>

        <Section id="profile" title="Your profile">
          <ProfileForm name={user.name} email={user.email} />
        </Section>

        <Section id="password" title="Password" description="Signed in with GitHub? You can also set a password to sign in with email.">
          <PasswordForm />
        </Section>

        <Section id="billing" title="Plan">
          <Box className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-medium text-fg capitalize">{org.plan ?? "free"}</span>
                <Label tone="accent">Current plan</Label>
              </div>
              <p className="text-sm text-fg-muted">Everything is unlocked while Brandrail is in early access.</p>
            </div>
          </Box>
        </Section>

        <Section id="danger" title="Danger zone">
          <DangerZone slug={org.slug} isOwner={org.role === "owner"} />
        </Section>
      </div>
    </div>
  );
}
