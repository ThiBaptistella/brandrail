"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@brandrail/ui";
import { LogoMark } from "@/components/logo";
import { footerNav, isActive, mainNav, type NavItem } from "./nav";

function Item({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={item.label}
      className={cn(
        "group/item flex h-9 items-center gap-3 rounded-md px-2.5 text-[13px] whitespace-nowrap transition-colors",
        active ? "bg-btn-hover text-fg" : "text-fg-muted hover:bg-btn-hover hover:text-fg",
      )}
    >
      <Icon size={18} strokeWidth={1.75} className={cn("shrink-0", active && "text-fg")} />
      <span className="opacity-0 transition-opacity duration-150 group-hover/sidebar:opacity-100">{item.label}</span>
    </Link>
  );
}

/** Supabase-style rail: 56px of icons that expands over the page on hover. */
export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden md:block">
      <nav
        aria-label="Main"
        className="group/sidebar flex h-full w-14 flex-col gap-1 overflow-hidden border-r border-line bg-sidebar px-2 py-3 transition-[width] duration-200 ease-out hover:w-56 hover:shadow-[var(--br-shadow-lg)]"
      >
        <Link href="/dashboard" aria-label="Brandrail home" className="mb-3 flex h-9 items-center gap-3 px-1.5">
          <LogoMark size={26} />
          <span className="text-sm font-semibold text-fg opacity-0 transition-opacity group-hover/sidebar:opacity-100">Brandrail</span>
        </Link>
        {mainNav.map((i) => (
          <Item key={i.href} item={i} pathname={pathname} />
        ))}
        <div className="my-2 h-px bg-line" />
        {footerNav.map((i) => (
          <Item key={i.href} item={i} pathname={pathname} />
        ))}
      </nav>
    </aside>
  );
}

/** Small screens: horizontal nav under the top bar. */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2 md:hidden">
      {[...mainNav, ...footerNav].map((item) => {
        const active = isActive(pathname, item);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px]",
              active ? "bg-btn-hover text-fg" : "text-fg-muted",
            )}
          >
            <Icon size={15} strokeWidth={1.75} /> {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
