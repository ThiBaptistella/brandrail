import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { ForgotForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to set a new one."
      footer={
        <Link href="/login" className="inline-flex items-center gap-1.5 font-medium text-fg underline-offset-4 hover:underline">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      }
    >
      <ForgotForm />
    </AuthCard>
  );
}
