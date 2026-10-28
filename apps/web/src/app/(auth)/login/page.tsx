import Link from "next/link";
import type { Metadata } from "next";
import { Box } from "@brandrail/ui";
import { LoginForm } from "@/components/auth/login-form";
import { Divider, OAuthButtons } from "@/components/auth/oauth-buttons";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next = "/dashboard", error } = await searchParams;
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return (
    <>
      <h1 className="mb-4 text-center text-2xl font-light tracking-tight text-fg">Sign in to Brandrail</h1>
      <Box className="bg-canvas-subtle p-4">
        <LoginForm next={safeNext} initialError={error} />
        <Divider />
        <OAuthButtons next={safeNext} />
      </Box>
      <Box className="mt-4 p-4 text-center text-sm">
        New to Brandrail?{" "}
        <Link href="/signup" className="text-accent hover:underline">
          Create an account
        </Link>
      </Box>
    </>
  );
}
