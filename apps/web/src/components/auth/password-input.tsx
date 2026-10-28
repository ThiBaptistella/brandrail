"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { TextInput, cn } from "@brandrail/ui";
import { authInput } from "./auth-card";

export function PasswordInput({
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <TextInput {...props} type={show ? "text" : "password"} className={cn(authInput, "pr-11", className)} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-fg-subtle hover:bg-btn-hover hover:text-fg"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
