import * as React from "react";
import { cn } from "./cn";

export type ButtonVariant = "default" | "primary" | "danger" | "invisible" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  default:
    "bg-btn text-fg border-btn-border hover:bg-btn-hover shadow-[var(--br-shadow-sm)]",
  primary:
    "bg-success-emphasis text-on-emphasis border-black/10 hover:bg-success-hover shadow-[var(--br-shadow-sm)]",
  danger:
    "bg-btn text-danger border-btn-border hover:bg-danger-emphasis hover:text-on-emphasis hover:border-transparent",
  invisible: "bg-transparent text-fg border-transparent hover:bg-btn-hover",
  outline: "bg-transparent text-on-emphasis border-white/60 hover:bg-white/10",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-7 px-3 text-xs gap-1",
  md: "h-8 px-3 text-sm gap-2",
  lg: "h-10 px-4 text-base gap-2",
};

export function buttonClasses(variant: ButtonVariant = "default", size: ButtonSize = "md", block = false) {
  return cn(
    "inline-flex items-center justify-center rounded-md border font-medium whitespace-nowrap",
    "transition-colors duration-100 select-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-emphasis",
    "disabled:opacity-50 disabled:pointer-events-none",
    variants[variant],
    sizes[size],
    block && "w-full",
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export function Button({
  variant = "default",
  size = "md",
  block,
  leadingIcon,
  trailingIcon,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={cn(buttonClasses(variant, size, block), className)} {...props}>
      {leadingIcon && <span className="shrink-0 text-current opacity-80">{leadingIcon}</span>}
      {children}
      {trailingIcon && <span className="shrink-0 text-current opacity-80">{trailingIcon}</span>}
    </button>
  );
}
