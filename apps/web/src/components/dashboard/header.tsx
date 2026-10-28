import Link from "next/link";
import { BellIcon, PlusIcon, SearchIcon, SignOutIcon, GearIcon, PersonIcon } from "@primer/octicons-react";
import { Avatar } from "@brandrail/ui";
import { LogoMark } from "@/components/logo";
import { signOutAction } from "@/app/actions/auth";
import type { Organization, SessionUser } from "@/lib/session";
import { DashboardTabs } from "./tabs";

export function DashboardHeader({ user, org }: { user: SessionUser; org: Organization }) {
  return (
    <header className="border-b border-line bg-header">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <Link href="/dashboard" aria-label="Brandrail dashboard" className="text-fg [--logo-ink:var(--br-header-bg)]">
          <LogoMark size={32} />
        </Link>
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm">
          <Link href="/dashboard" className="flex items-center gap-2 truncate rounded-md px-1.5 py-1 font-semibold text-fg hover:bg-btn-hover">
            <Avatar name={org.name} size={20} square />
            {org.name}
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <label className="hidden h-8 w-72 items-center gap-2 rounded-md border border-line bg-canvas px-2 text-fg-muted lg:flex">
            <SearchIcon size={16} />
            <input
              aria-label="Search tokens, components and scans"
              placeholder="Type / to search"
              className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-muted"
            />
          </label>
          <Link
            href="/dashboard/checks?new=1"
            aria-label="New scan"
            className="flex h-8 items-center gap-1 rounded-md border border-line px-2 text-fg-muted hover:bg-btn-hover"
          >
            <PlusIcon size={16} />
          </Link>
          <button
            type="button"
            aria-label="Notifications"
            className="relative flex h-8 w-8 items-center justify-center rounded-md border border-line text-fg-muted hover:bg-btn-hover"
          >
            <BellIcon size={16} />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent-emphasis ring-2 ring-header" />
          </button>

          <details className="relative">
            <summary className="flex cursor-pointer list-none items-center rounded-full [&::-webkit-details-marker]:hidden" aria-label="Open user menu">
              <Avatar name={user.name} size={32} />
            </summary>
            <div className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-overlay py-2 shadow-[var(--br-shadow-lg)]">
              <div className="flex items-center gap-2 px-4 pb-2">
                <Avatar name={user.name} size={32} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-fg">{user.name}</div>
                  <div className="truncate text-xs text-fg-muted">{user.email}</div>
                </div>
              </div>
              <div className="my-1 h-px bg-line" />
              <Link href="/dashboard/settings#profile" className="flex items-center gap-2 px-4 py-1.5 text-sm text-fg hover:bg-btn-hover">
                <PersonIcon size={16} className="text-fg-muted" /> Your profile
              </Link>
              <Link href="/dashboard/settings" className="flex items-center gap-2 px-4 py-1.5 text-sm text-fg hover:bg-btn-hover">
                <GearIcon size={16} className="text-fg-muted" /> Settings
              </Link>
              <div className="my-1 h-px bg-line" />
              <form action={signOutAction}>
                <button type="submit" className="flex w-full items-center gap-2 px-4 py-1.5 text-left text-sm text-fg hover:bg-btn-hover">
                  <SignOutIcon size={16} className="text-fg-muted" /> Sign out
                </button>
              </form>
            </div>
          </details>
        </div>
      </div>
      <DashboardTabs />
    </header>
  );
}
