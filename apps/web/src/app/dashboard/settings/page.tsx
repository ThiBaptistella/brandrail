import type { Metadata } from "next";
import { Avatar, Box, BoxRow, Button, FormControl, Label, Select, TextInput } from "@brandrail/ui";
import { PasswordForm } from "@/components/settings/password-form";
import { requireOrg } from "@/lib/session";

export const metadata: Metadata = { title: "Settings" };

const nav = [
  { id: "general", label: "General" },
  { id: "profile", label: "Your profile" },
  { id: "password", label: "Password" },
  { id: "members", label: "Members" },
  { id: "billing", label: "Plan & billing" },
  { id: "danger", label: "Danger zone" },
];

function Section({ id, title, children, description }: { id: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="border-b border-line pb-2 text-xl font-normal text-fg">{title}</h2>
      {description && <p className="mt-2 text-sm text-fg-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const { user, org } = await requireOrg();

  return (
    <div className="grid gap-8 md:grid-cols-[220px_1fr]">
      <aside>
        <div className="mb-4 flex items-center gap-2">
          <Avatar name={org.name} size={32} square />
          <div>
            <div className="font-semibold text-fg">{org.name}</div>
            <div className="text-xs text-fg-muted">Organisation settings</div>
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

      <div className="flex min-w-0 flex-col gap-10">
        <Section id="general" title="General">
          <form className="flex max-w-md flex-col gap-4">
            <FormControl label="Organisation name" htmlFor="org-name">
              <TextInput id="org-name" defaultValue={org.name} />
            </FormControl>
            <FormControl label="URL" htmlFor="org-slug" caption="Changing this breaks existing MCP and CLI configs.">
              <TextInput id="org-slug" defaultValue={org.slug} className="font-mono" />
            </FormControl>
            <FormControl label="Data region" htmlFor="region">
              <Select id="region" defaultValue="ap-southeast-2">
                <option value="ap-southeast-2">Australia (Sydney)</option>
                <option value="us-east-1">United States (N. Virginia)</option>
                <option value="eu-west-1">Europe (Ireland)</option>
              </Select>
            </FormControl>
            <div>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Section>

        <Section id="profile" title="Your profile">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} size={64} />
            <div>
              <div className="text-lg font-semibold text-fg">{user.name}</div>
              <div className="text-sm text-fg-muted">{user.email}</div>
            </div>
          </div>
        </Section>

        <Section id="password" title="Password">
          <PasswordForm />
        </Section>

        <Section id="members" title="Members" description="Owners and admins edit the Brand Kit. Members can run checks and create keys.">
          <Box>
            <BoxRow className="flex items-center gap-3">
              <Avatar name={user.name} size={32} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-fg">{user.name}</div>
                <div className="truncate text-xs text-fg-muted">{user.email}</div>
              </div>
              <Label>{org.role}</Label>
            </BoxRow>
            <BoxRow className="flex flex-col gap-2 bg-canvas-subtle sm:flex-row">
              <TextInput placeholder="Invite by email" aria-label="Invite by email" type="email" />
              <Select aria-label="Role" defaultValue="member" className="sm:w-36">
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </Select>
              <Button className="shrink-0">Send invite</Button>
            </BoxRow>
          </Box>
        </Section>

        <Section id="billing" title="Plan & billing">
          <Box className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-fg">Free</span>
                <Label tone="accent">Current plan</Label>
              </div>
              <p className="text-sm text-fg-muted">1 token set · 1 repo · 10 URL scans a month</p>
            </div>
            <Button variant="primary">Upgrade to Team · $249/mo</Button>
          </Box>
        </Section>

        <Section id="danger" title="Danger zone">
          <Box className="border-danger/50">
            <BoxRow className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-fg">Delete this organisation</div>
                <div className="text-sm text-fg-muted">Removes the Brand Kit, all scans and keys. This can&apos;t be undone.</div>
              </div>
              <Button variant="danger">Delete organisation</Button>
            </BoxRow>
          </Box>
        </Section>
      </div>
    </div>
  );
}
