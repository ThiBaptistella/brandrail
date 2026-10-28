import { useId } from "react";
import { cn } from "@brandrail/ui";

/** Placeholder mark: a rounded square with the brand gradient. Swap for the real logo later. */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className={cn("shrink-0", className)}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6ee7b7" />
          <stop offset="0.5" stopColor="#3ecf8e" />
          <stop offset="1" stopColor="#0e9f6e" />
        </linearGradient>
        <linearGradient id={`${id}-h`} x1="16" y1="0" x2="16" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill={`url(#${id}-g)`} />
      <rect x="1" y="1" width="30" height="16" rx="9" fill={`url(#${id}-h)`} />
      <rect x="1.5" y="1.5" width="29" height="29" rx="8.5" stroke="#ffffff" strokeOpacity="0.18" />
    </svg>
  );
}

export function Logo({ className, wordmark = true, size }: { className?: string; wordmark?: boolean; size?: number }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark size={size} />
      {wordmark && <span className="text-base">Brandrail</span>}
    </span>
  );
}
