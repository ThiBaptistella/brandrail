"use client";

import { useFormStatus } from "react-dom";
import { Button, Spinner, type ButtonProps } from "@brandrail/ui";

export function SubmitButton({ children, pendingText, ...props }: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-busy={pending} {...props}>
      {pending ? (
        <>
          <Spinner size={14} /> {pendingText ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
