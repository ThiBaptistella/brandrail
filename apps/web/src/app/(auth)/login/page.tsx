import Link from "next/link";
import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next = "/dashboard", error } = await searchParams;
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your Brandrail account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-fg underline-offset-4 hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <OAuthButtons next={safeNext} />
      <LoginForm next={safeNext} initialError={error} />
    </AuthCard>
  );
}
