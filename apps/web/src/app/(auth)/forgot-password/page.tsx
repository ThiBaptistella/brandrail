import Link from "next/link";
import type { Metadata } from "next";
import { Box } from "@brandrail/ui";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="mb-4 text-center text-2xl font-light tracking-tight text-fg">Reset your password</h1>
      <Box className="bg-canvas-subtle p-4">
        <ForgotForm />
      </Box>
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-accent hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
