import Link from "next/link";
import { GlobeIcon } from "@primer/octicons-react";
import { LogoMark } from "./logo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Brand Kit", href: "/#how" },
      { label: "Guardrail (MCP)", href: "/#how" },
      { label: "Checker", href: "/#how" },
      { label: "Drift reports", href: "/#how" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Roadmap", href: "#" },
    ],
  },
  {
    title: "Integrations",
    links: [
      { label: "Claude Code", href: "/dashboard/connect" },
      { label: "Cursor", href: "/dashboard/connect" },
      { label: "GitHub Copilot", href: "/dashboard/connect" },
      { label: "Lovable", href: "/dashboard/connect" },
      { label: "GitHub Actions", href: "/dashboard/connect#github-action" },
      { label: "Figma", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: "#" },
      { label: "CLI reference", href: "#" },
      { label: "MCP tools", href: "#" },
      { label: "Status", href: "#" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Security", href: "#" },
      { label: "Contact", href: "mailto:hello@brandrail.dev" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[#3fb950]/50 bg-[#0d1117]">
      <div className="mx-auto max-w-[1012px] px-4 pt-14 md:px-8">
        <LogoMark size={32} />
        <p className="mt-6 flex items-center gap-2 font-mono text-sm tracking-wider text-white uppercase">
          <span className="h-3 w-2 bg-[#3fb950]" aria-hidden /> The design-system newsletter
        </p>
        <p className="mt-3 max-w-sm text-[15px] leading-6 text-[#9198a1]">
          Notes on design systems, AI coding tools and brand drift. Twice a month. Right in your inbox.
        </p>
        <Link
          href="/signup"
          className="mt-5 inline-flex h-8 items-center rounded-md bg-[#238636] px-3 text-sm font-medium text-white hover:bg-[#29903b]"
        >
          Subscribe
        </Link>

        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 border-t border-white/10 pt-8 md:grid-cols-4">
          {columns.map((c) => (
            <div key={c.title}>
              <h3 className="font-mono text-xs tracking-wider text-[#9198a1] uppercase">{c.title}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-sm text-[#f0f6fc] hover:text-[#4493f8] hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-14 border-t border-white/10">
        <div className="mx-auto flex max-w-[1012px] flex-col gap-4 px-4 py-6 md:flex-row md:items-center md:justify-between md:px-8">
          <ul className="flex flex-wrap gap-x-4 gap-y-2 font-mono text-[11px] tracking-wider text-[#9198a1] uppercase">
            <li>© {new Date().getFullYear()} Brandrail · Built in Perth</li>
            <li><a href="#" className="hover:text-white">Terms</a></li>
            <li><a href="#" className="hover:text-white">Privacy</a></li>
            <li><a href="#" className="hover:text-white">Cookies</a></li>
          </ul>
          <span className="inline-flex h-8 items-center gap-1.5 self-start rounded-md border border-white/15 px-3 text-sm text-[#f0f6fc]">
            <GlobeIcon size={14} /> English
          </span>
        </div>
      </div>
    </footer>
  );
}
