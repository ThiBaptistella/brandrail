import { Boxes, Home, Palette, Plug, Settings, ShieldCheck, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

export const mainNav: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: Home, exact: true },
  { href: "/dashboard/brand-kit", label: "Brand Kit", icon: Palette },
  { href: "/dashboard/components", label: "Components", icon: Boxes },
  { href: "/dashboard/connect", label: "Connect", icon: Plug },
  { href: "/dashboard/checks", label: "Checks", icon: ShieldCheck },
];

export const footerNav: NavItem[] = [{ href: "/dashboard/settings", label: "Settings", icon: Settings }];

export function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function pageLabel(pathname: string) {
  return [...mainNav, ...footerNav].find((i) => isActive(pathname, i))?.label ?? "";
}
