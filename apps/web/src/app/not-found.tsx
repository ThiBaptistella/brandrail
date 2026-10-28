import Link from "next/link";
import { buttonClasses } from "@brandrail/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas px-4 text-center">
      <p className="font-mono text-sm text-fg-muted">404</p>
      <h1 className="text-3xl font-semibold text-fg">This page went off-brand.</h1>
      <p className="text-fg-muted">We couldn&apos;t find what you were looking for.</p>
      <Link href="/" className={buttonClasses("default")}>Back home</Link>
    </main>
  );
}
