import * as React from "react";
import { cn } from "./cn";

export const inputClasses = cn(
  "block w-full h-8 rounded-md border border-line bg-canvas px-3 text-sm text-fg",
  "placeholder:text-fg-subtle shadow-[inset_0_1px_0_rgba(208,215,222,0.2)]",
  "focus:outline-none focus:border-accent-emphasis focus:ring-2 focus:ring-accent-emphasis/30",
  "disabled:bg-canvas-subtle disabled:text-fg-muted",
);

export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...props }, ref) {
    return <input ref={ref} className={cn(inputClasses, className)} {...props} />;
  },
);

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputClasses, "h-auto min-h-20 py-2", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputClasses, "pr-8 appearance-auto", className)} {...props}>
      {children}
    </select>
  );
}

export interface FormControlProps {
  label: string;
  htmlFor: string;
  caption?: React.ReactNode;
  error?: string;
  required?: boolean;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}

export function FormControl({ label, htmlFor, caption, error, required, trailing, children }: FormControlProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-fg">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
        {trailing}
      </div>
      {children}
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : caption ? (
        <p className="text-xs text-fg-muted">{caption}</p>
      ) : null}
    </div>
  );
}
