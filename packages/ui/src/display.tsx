import * as React from "react";
import { cn } from "./cn";

/* ---------- Box / Card ---------- */
export function Box({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-md border border-line bg-surface", className)} {...props} />;
}

export function BoxHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center gap-2 rounded-t-md border-b border-line bg-canvas-subtle px-4 py-3", className)}
      {...props}
    />
  );
}

export function BoxRow({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("border-b border-line px-4 py-3 last:border-b-0", className)} {...props} />;
}

/* ---------- Label (pill) ---------- */
export type LabelTone = "default" | "accent" | "success" | "attention" | "danger" | "done";
const tones: Record<LabelTone, string> = {
  default: "border-line text-fg-muted",
  accent: "border-accent-muted text-accent",
  success: "border-success/40 text-success",
  attention: "border-attention/40 text-attention",
  danger: "border-danger/40 text-danger",
  done: "border-done/40 text-done",
};

export function Label({
  tone = "default",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: LabelTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center h-5 px-2 rounded-full border text-xs font-medium leading-none whitespace-nowrap",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

/* ---------- Counter ---------- */
export function Counter({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-5 h-[18px] px-1.5 rounded-full bg-fg-muted/15 text-xs font-medium text-fg",
        className,
      )}
      {...props}
    />
  );
}

/* ---------- Flash (banner) ---------- */
export type FlashTone = "accent" | "success" | "attention" | "danger";
const flashTones: Record<FlashTone, string> = {
  accent: "bg-accent-subtle border-accent-muted",
  success: "bg-success-subtle border-success/40",
  attention: "bg-attention-subtle border-attention/40",
  danger: "bg-danger-subtle border-danger/40",
};

export function Flash({
  tone = "accent",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tone?: FlashTone }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("rounded-md border px-4 py-3 text-sm text-fg", flashTones[tone], className)}
      {...props}
    />
  );
}

/* ---------- Avatar ---------- */
export function Avatar({ name, size = 20, square, className }: { name: string; size?: number; square?: boolean; className?: string }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-semibold text-white ring-1 ring-black/10",
        square ? "rounded-md" : "rounded-full",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(9, size * 0.42), background: `hsl(${hash} 55% 45%)` }}
    >
      {initials}
    </span>
  );
}

/* ---------- Spinner ---------- */
export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={cn("animate-spin", className)} aria-label="Loading">
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M15 8a7 7 0 0 0-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- Progress bar ---------- */
export function ProgressBar({ value, tone = "success", className }: { value: number; tone?: "success" | "attention" | "danger" | "accent"; className?: string }) {
  const color = { success: "bg-success-emphasis", attention: "bg-attention", danger: "bg-danger-emphasis", accent: "bg-accent-emphasis" }[tone];
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-fg-muted/15", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

/* ---------- Blankslate ---------- */
export function Blankslate({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      {icon && <div className="mb-3 text-fg-muted">{icon}</div>}
      <h3 className="text-xl font-semibold text-fg">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
