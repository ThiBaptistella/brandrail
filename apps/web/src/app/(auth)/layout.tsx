import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { DemoBanner } from "@/components/demo-banner";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <DemoBanner />
      <main className="flex flex-1 flex-col items-center px-4 pt-10 pb-16">
        <Link href="/" aria-label="Brandrail home" className="text-fg [--logo-ink:var(--br-canvas-default)]">
          <LogoMark size={48} />
        </Link>
        <div className="mt-6 w-full max-w-[340px]">{children}</div>
      </main>
      <footer className="pb-10 text-center text-xs text-fg-muted">
        <nav className="flex justify-center gap-4">
          <Link href="/" className="hover:text-accent hover:underline">Home</Link>
          <a href="mailto:hello@brandrail.dev" className="hover:text-accent hover:underline">Contact</a>
          <span>Privacy</span>
          <span>Terms</span>
        </nav>
      </footer>
    </div>
  );
}
