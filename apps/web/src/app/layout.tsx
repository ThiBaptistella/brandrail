import type { Metadata, Viewport } from "next";
import "@brandrail/kit/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Brandrail — your design system, enforced in every AI tool", template: "%s · Brandrail" },
  description:
    "Brandrail makes Cursor, Claude Code, Copilot and Lovable build with your design system, and checks every pull request for brand drift.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
