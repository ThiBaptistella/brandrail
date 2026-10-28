import Link from "next/link";
import {
  CheckCircleFillIcon,
  CopilotIcon,
  GitPullRequestIcon,
  PaintbrushIcon,
  PlugIcon,
  ShieldCheckIcon,
  XCircleFillIcon,
  GraphIcon,
} from "@primer/octicons-react";
import { buttonClasses } from "@brandrail/ui";
import { Logo } from "@/components/logo";
import { getUser } from "@/lib/session";

export default async function HomePage() {
  const user = await getUser();

  return (
    <div className="marketing min-h-dvh">
      {/* Header */}
      <header className="relative z-10">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-6 px-4 md:px-8">
          <Link href="/" className="[--logo-ink:#0d1117] text-white" aria-label="Brandrail home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-6 text-[15px] font-medium text-white/90 md:flex">
            <a href="#product" className="hover:text-white/70">Product</a>
            <a href="#how" className="hover:text-white/70">How it works</a>
            <a href="#pricing" className="hover:text-white/70">Pricing</a>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className={buttonClasses("outline", "md")}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-[15px] font-medium text-white hover:text-white/70">
                  Sign in
                </Link>
                <Link href="/signup" className={buttonClasses("outline", "md")}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="hero-glow pointer-events-none absolute inset-0" />
        <div className="grid-lines pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-[1280px] px-4 pt-20 pb-16 text-center md:px-8 md:pt-28">
          <Link
            href="#how"
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm text-white/80 hover:border-white/30"
          >
            <span className="rounded-full bg-[#238636] px-2 py-0.5 text-xs font-semibold text-white">New</span>
            MCP server for Cursor, Claude Code & Copilot
          </Link>
          <h1 className="mx-auto max-w-4xl text-[40px] leading-[1.1] font-semibold tracking-tight text-white md:text-[64px]">
            Your design system,
            <br className="hidden md:block" /> enforced in every AI tool.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-[#9198a1] md:text-xl">
            Everyone in your company is vibe-coding UI. Brandrail makes sure every button, colour and font they ship
            is yours, and catches the ones that slip through.
          </p>

          <form action="/signup" className="mx-auto mt-10 flex max-w-xl flex-col gap-3 sm:flex-row">
            <label htmlFor="hero-email" className="sr-only">Work email</label>
            <input
              id="hero-email"
              name="email"
              type="email"
              placeholder="you@company.com"
              className="h-12 w-full min-w-0 rounded-md sm:flex-1 border border-white/20 bg-white px-4 text-base text-[#1f2328] placeholder:text-[#59636e] focus:outline-2 focus:outline-[#4493f8]"
            />
            <button type="submit" className={buttonClasses("primary", "lg") + " h-12 px-6 text-base"}>
              Sign up for Brandrail
            </button>
          </form>
          <p className="mt-4 text-sm text-[#9198a1]">
            Free for one repo. <Link href="/login" className="text-[#4493f8] hover:underline">Try the demo →</Link>
          </p>

          {/* Product visual */}
          <div id="product" className="relative mx-auto mt-16 max-w-5xl text-left">
            <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-[#4493f8]/40 via-[#ab7df8]/20 to-transparent blur-sm" />
            <div className="relative grid overflow-hidden rounded-xl border border-white/10 bg-[#010409] md:grid-cols-[1.1fr_1fr]">
              <div className="border-b border-white/10 md:border-r md:border-b-0">
                <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5 text-xs text-[#9198a1]">
                  <CopilotIcon size={14} /> Agent · building <span className="text-white">FleetDashboard.tsx</span>
                </div>
                <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6 text-[#e6edf3]">
                  <code>
                    <span className="text-[#ff7b72]">import</span> {"{ "}
                    <span className="text-[#ffa657]">Button</span>, <span className="text-[#ffa657]">Card</span>
                    {" }"} <span className="text-[#ff7b72]">from</span>{" "}
                    <span className="text-[#a5d6ff]">&quot;@acme/ui&quot;</span>
                    {"\n\n"}
                    <span className="text-[#ff7b72]">export function</span>{" "}
                    <span className="text-[#d2a8ff]">FleetDashboard</span>() {"{"}
                    {"\n  "}
                    <span className="text-[#ff7b72]">return</span> (
                    {"\n    "}&lt;<span className="text-[#7ee787]">Card</span>{" "}
                    <span className="text-[#79c0ff]">padding</span>=<span className="text-[#a5d6ff]">&quot;md&quot;</span>&gt;
                    {"\n      "}&lt;<span className="text-[#7ee787]">Button</span>{" "}
                    <span className="text-[#79c0ff]">variant</span>=<span className="text-[#a5d6ff]">&quot;primary&quot;</span>&gt;
                    Schedule service&lt;/<span className="text-[#7ee787]">Button</span>&gt;
                    {"\n    "}&lt;/<span className="text-[#7ee787]">Card</span>&gt;
                    {"\n  "})
                    {"\n"}
                    {"}"}
                  </code>
                </pre>
                <div className="mx-4 mb-4 rounded-md border border-[#3d444d] bg-[#151b23] p-3 font-mono text-xs text-[#9198a1]">
                  <span className="text-[#3fb950]">✓</span> brandrail.find_component(&quot;primary action&quot;) → Button
                  <br />
                  <span className="text-[#3fb950]">✓</span> brandrail.validate_snippet → 0 violations
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-sm text-white">
                  <GitPullRequestIcon size={16} className="text-[#3fb950]" />
                  <span className="font-semibold">Add fleet maintenance page</span>
                  <span className="text-[#9198a1]">#482</span>
                </div>
                <div className="mt-4 rounded-md border border-[#3d444d]">
                  <div className="flex items-center gap-2 border-b border-[#3d444d] bg-[#151b23] px-3 py-2 text-xs">
                    <span className="[--logo-ink:#0d1117] text-white"><Logo wordmark={false} className="scale-75" /></span>
                    <span className="font-semibold text-white">brandrail</span>
                    <span className="text-[#9198a1]">bot commented</span>
                  </div>
                  <div className="space-y-3 p-3 text-sm">
                    <div className="flex items-baseline justify-between">
                      <span className="text-white">Brand score</span>
                      <span className="text-2xl font-semibold text-[#3fb950]">94<span className="text-sm text-[#9198a1]">/100</span></span>
                    </div>
                    <ul className="space-y-2 text-[13px]">
                      <li className="flex gap-2 text-[#9198a1]">
                        <XCircleFillIcon size={14} className="mt-0.5 shrink-0 text-[#f85149]" />
                        <span>
                          <code className="text-[#e6edf3]">Header.tsx:18</code> hard-coded <code className="text-[#e6edf3]">#3b82f6</code> → use{" "}
                          <code className="text-[#4493f8]">color.accent.default</code>
                        </span>
                      </li>
                      <li className="flex gap-2 text-[#9198a1]">
                        <CheckCircleFillIcon size={14} className="mt-0.5 shrink-0 text-[#3fb950]" />
                        <span>All buttons use <code className="text-[#e6edf3]">@acme/ui</code></span>
                      </li>
                      <li className="flex gap-2 text-[#9198a1]">
                        <CheckCircleFillIcon size={14} className="mt-0.5 shrink-0 text-[#3fb950]" />
                        <span>Contrast passes WCAG AA</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three pillars */}
      <section id="how" className="mx-auto max-w-[1280px] px-4 py-24 md:px-8">
        <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
          Generate on-brand. <span className="text-[#9198a1]">Check what ships. Prove it to leadership.</span>
        </h2>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: <PaintbrushIcon size={24} />,
              color: "text-[#ab7df8]",
              title: "Brand Kit",
              body: "Import tokens from Figma or your codebase. Colours, type, spacing, radius and components, versioned like code.",
            },
            {
              icon: <PlugIcon size={24} />,
              color: "text-[#4493f8]",
              title: "Guardrail",
              body: "One MCP server and rule files for Cursor, Claude Code, Copilot and Lovable. The AI can only use what you approved.",
            },
            {
              icon: <ShieldCheckIcon size={24} />,
              color: "text-[#3fb950]",
              title: "Checker",
              body: "Every pull request and live URL gets a brand score, file-by-file violations and a one-click fix.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6">
              <div className={f.color}>{f.icon}</div>
              <h3 className="mt-4 text-xl font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-6 text-[#9198a1]">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid items-center gap-8 rounded-xl border border-white/10 bg-[#010409] p-8 md:grid-cols-2">
          <div>
            <div className="text-[#3fb950]"><GraphIcon size={24} /></div>
            <h3 className="mt-4 text-2xl font-semibold text-white">See brand drift before your customers do</h3>
            <p className="mt-2 text-[15px] leading-6 text-[#9198a1]">
              A live score for every repo and app, the components people keep re-inventing, and a monthly report you
              can forward to the board.
            </p>
          </div>
          <div className="space-y-3">
            {[
              { name: "fleet-portal", score: 94 },
              { name: "safety-forms (Lovable)", score: 71 },
              { name: "procurement-ui", score: 58 },
            ].map((r) => (
              <div key={r.name} className="flex items-center gap-3">
                <span className="w-48 truncate font-mono text-sm text-[#e6edf3]">{r.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={r.score >= 80 ? "h-full bg-[#3fb950]" : r.score >= 65 ? "h-full bg-[#d29922]" : "h-full bg-[#f85149]"}
                    style={{ width: `${r.score}%` }}
                  />
                </div>
                <span className="w-8 text-right text-sm font-semibold text-white">{r.score}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="relative overflow-hidden border-t border-white/10">
        <div className="hero-glow pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-[1280px] px-4 py-24 text-center md:px-8">
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Free for one repo. Forever.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[#9198a1]">
            Team from $249/month. Business and Enterprise with SSO, audit log and Australian data residency.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/signup" className={buttonClasses("primary", "lg")}>Start free</Link>
            <Link href="/login" className={buttonClasses("outline", "lg")}>Try the demo</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-[#9198a1] md:flex-row md:px-8">
          <span className="[--logo-ink:#0d1117] text-white"><Logo /></span>
          <span>© {new Date().getFullYear()} Brandrail. Built in Perth.</span>
        </div>
      </footer>
    </div>
  );
}
