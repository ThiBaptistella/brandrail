import { cn } from "@brandrail/ui";

/** Brandrail mark: two guard rails converging on a path. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="currentColor" />
      <path d="M10 25 L14 7" stroke="var(--logo-ink, #0d1117)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M22 25 L18 7" stroke="var(--logo-ink, #0d1117)" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M11.4 19 H20.6 M12.6 13.5 H19.4" stroke="var(--logo-ink, #0d1117)" strokeWidth="1.8" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

export function Logo({ className, wordmark = true }: { className?: string; wordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark />
      {wordmark && <span className="text-base">Brandrail</span>}
    </span>
  );
}
