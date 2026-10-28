"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CheckCircleIcon,
  GearIcon,
  HomeIcon,
  PackageIcon,
  PaintbrushIcon,
  PlugIcon,
} from "@primer/octicons-react";
import { Counter, cn } from "@brandrail/ui";

const tabs = [
  { href: "/dashboard", label: "Overview", icon: HomeIcon, exact: true },
  { href: "/dashboard/brand-kit", label: "Brand Kit", icon: PaintbrushIcon },
  { href: "/dashboard/components", label: "Components", icon: PackageIcon, count: 10 },
  { href: "/dashboard/connect", label: "Connect", icon: PlugIcon },
  { href: "/dashboard/checks", label: "Checks", icon: CheckCircleIcon, count: 7 },
  { href: "/dashboard/settings", label: "Settings", icon: GearIcon },
];

export function DashboardTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="Organisation" className="-mb-px flex gap-2 overflow-x-auto px-4 md:px-6">
      {tabs.map(({ href, label, icon: Icon, exact, count }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex shrink-0 items-center gap-2 px-2 pt-1 pb-3 text-sm text-fg",
              active && "font-semibold",
            )}
          >
            <span className="flex items-center gap-2 rounded-md px-2 py-1 group-hover:bg-btn-hover">
              <Icon size={16} className="text-fg-muted" />
              {label}
              {count !== undefined && <Counter>{count}</Counter>}
            </span>
            {active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#fd8c73]" />}
          </Link>
        );
      })}
    </nav>
  );
}
