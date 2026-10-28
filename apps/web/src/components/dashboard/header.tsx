import Link from "next/link";
import { Bell, Check, ChevronsUpDown, CircleHelp, LogOut, Monitor, Moon, Plus, Search, Settings, Sun, User } from "lucide-react";
import { Avatar, cn } from "@brandrail/ui";
import { LogoMark } from "@/components/logo";
import { signOutAction } from "@/app/actions/auth";
import { switchOrgAction } from "@/app/actions/org";
import { setThemeAction } from "@/app/actions/theme";
import type { Organization, SessionUser } from "@/lib/session";
import type { ThemePref } from "@/lib/theme";
import { BreadcrumbPage } from "./breadcrumb-page";

const themes: { value: ThemePref; label: string; icon: typeof Sun }[] = [
  { value: "dark", label: "Dark", icon: Moon },
  { value: "light", label: "Light", icon: Sun },
  { value: "system", label: "System", icon: Monitor },
];

const iconBtn =
  "flex h-8 w-8 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-btn-hover hover:text-fg";

export function DashboardHeader({ user, org, orgs, theme }: { user: SessionUser; org: Organization; orgs: Organization[]; theme: ThemePref }) {
  return (
    <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur md:px-5">
      <Link href="/dashboard" className="md:hidden" aria-label="Brandrail home">
        <LogoMark size={24} />
      </Link>

      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-[13px]">
        <details className="relative min-w-0">
          <summary className="flex min-w-0 cursor-pointer list-none items-center gap-2 rounded-md px-1.5 py-1 hover:bg-btn-hover [&::-webkit-details-marker]:hidden" aria-label="Switch organisation">
            <Avatar name={org.name} size={20} square />
            <span className="truncate font-medium text-fg">{org.name}</span>
            <span className="rounded border border-line px-1.5 py-px text-[10px] font-medium tracking-wide text-fg-muted uppercase">{org.plan ?? "free"}</span>
            <ChevronsUpDown size={14} className="shrink-0 text-fg-subtle" />
          </summary>
          <div className="absolute left-0 z-40 mt-2 w-64 overflow-hidden rounded-lg border border-line bg-overlay py-1.5 text-[13px] shadow-[var(--br-shadow-lg)]">
            <div className="px-3 pt-1 pb-1.5 text-[11px] tracking-wide text-fg-subtle uppercase">Organisations</div>
            <form action={switchOrgAction}>
              {orgs.map((o) => (
                <button key={o.id} type="submit" name="orgId" value={o.id} className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left hover:bg-btn-hover">
                  <Avatar name={o.name} size={18} square />
                  <span className="min-w-0 flex-1 truncate text-fg">{o.name}</span>
                  <span className="text-[11px] text-fg-subtle">{o.role}</span>
                  {o.id === org.id ? <Check size={14} className="text-brand" /> : <span className="w-3.5" />}
                </button>
              ))}
            </form>
            <div className="my-1 h-px bg-line" />
            <Link href="/onboarding?new=1" className="flex items-center gap-2.5 px-3 py-1.5 text-fg-muted hover:bg-btn-hover hover:text-fg">
              <Plus size={14} /> New organisation
            </Link>
          </div>
        </details>
        <BreadcrumbPage />
      </nav>

      <div className="ml-auto flex items-center gap-1.5">
        <label className="hidden h-8 w-64 items-center gap-2 rounded-md border border-line bg-canvas-subtle px-2.5 text-fg-subtle lg:flex">
          <Search size={14} />
          <input
            aria-label="Search tokens, components and scans"
            placeholder="Search…"
            className="w-full bg-transparent text-[13px] text-fg outline-none placeholder:text-fg-subtle"
          />
          <kbd className="rounded border border-line px-1 font-mono text-[10px] text-fg-subtle">⌘K</kbd>
        </label>
        <a
          href="mailto:hello@brandrail.dev?subject=Feedback"
          className="hidden h-8 items-center rounded-md border border-btn-border bg-btn px-2.5 text-[13px] text-fg hover:bg-btn-hover sm:flex"
        >
          Feedback
        </a>
        <button type="button" aria-label="Help" className={iconBtn}>
          <CircleHelp size={16} />
        </button>
        <button type="button" aria-label="Notifications" className={cn(iconBtn, "relative")}>
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-brand" />
        </button>

        <details className="relative ml-1">
          <summary className="flex cursor-pointer list-none rounded-full [&::-webkit-details-marker]:hidden" aria-label="Open user menu">
            <Avatar name={user.name} size={28} />
          </summary>
          <div className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-lg border border-line bg-overlay py-1.5 text-[13px] shadow-[var(--br-shadow-lg)]">
            <div className="px-3 py-2">
              <div className="truncate font-medium text-fg">{user.name}</div>
              <div className="truncate text-xs text-fg-muted">{user.email}</div>
            </div>
            <div className="my-1 h-px bg-line" />
            <Link href="/dashboard/settings#profile" className="flex items-center gap-2.5 px-3 py-1.5 text-fg-muted hover:bg-btn-hover hover:text-fg">
              <User size={14} /> Your profile
            </Link>
            <Link href="/dashboard/settings" className="flex items-center gap-2.5 px-3 py-1.5 text-fg-muted hover:bg-btn-hover hover:text-fg">
              <Settings size={14} /> Organisation settings
            </Link>
            <div className="my-1 h-px bg-line" />
            <div className="px-3 pt-1.5 pb-1 text-[11px] tracking-wide text-fg-subtle uppercase">Theme</div>
            <form action={setThemeAction} className="flex gap-1 px-2 pb-1.5">
              {themes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="submit"
                  name="theme"
                  value={value}
                  aria-pressed={theme === value}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs",
                    theme === value ? "border-line-strong bg-btn-hover text-fg" : "border-transparent text-fg-muted hover:bg-btn-hover",
                  )}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </form>
            <div className="my-1 h-px bg-line" />
            <form action={signOutAction}>
              <button type="submit" className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-fg-muted hover:bg-btn-hover hover:text-fg">
                <LogOut size={14} /> Sign out
              </button>
            </form>
          </div>
        </details>
      </div>
    </header>
  );
}
