"use client";

import { usePathname } from "next/navigation";
import { pageLabel } from "./nav";

export function BreadcrumbPage() {
  const label = pageLabel(usePathname());
  if (!label) return null;
  return (
    <>
      <span className="text-fg-subtle">/</span>
      <span className="truncate text-fg">{label}</span>
    </>
  );
}
