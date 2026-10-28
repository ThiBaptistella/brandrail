import Link from "next/link";
import { Logo } from "@/components/logo";
import { DemoBanner } from "@/components/demo-banner";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-canvas">
      {/* backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 0%, color-mix(in srgb, var(--br-brand) 16%, transparent) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage: "radial-gradient(color-mix(in srgb, var(--br-fg-default) 10%, transparent) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 80%)",
        }}
      />

      <div className="relative">
        <DemoBanner />
        <header className="mx-auto flex h-16 w-full max-w-6xl items-center px-6">
          <Link href="/" aria-label="Brandrail home" className="text-fg">
            <Logo />
          </Link>
        </header>
      </div>

      <main className="relative flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>

      <footer className="relative pb-8 text-center text-xs text-fg-subtle">
        <nav className="flex justify-center gap-5">
          <Link href="/" className="hover:text-fg">Home</Link>
          <a href="mailto:hello@brandrail.dev" className="hover:text-fg">Contact</a>
          <a href="#" className="hover:text-fg">Privacy</a>
          <a href="#" className="hover:text-fg">Terms</a>
        </nav>
      </footer>
    </div>
  );
}
