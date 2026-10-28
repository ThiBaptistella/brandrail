import type { Metadata, Viewport } from "next";
import "@brandrail/kit/styles.css";
import "./globals.css";
import { getThemePref } from "@/lib/theme";

export const metadata: Metadata = {
  title: { default: "Brandrail — your design system, enforced in every AI tool", template: "%s · Brandrail" },
  description:
    "Brandrail makes Cursor, Claude Code, Copilot and Lovable build with your design system, and checks every pull request for brand drift.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfc" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
};

// "system" resolves on the client before paint to avoid a flash.
const systemThemeScript = `try{if(document.documentElement.dataset.themePref==="system"){document.documentElement.dataset.theme=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const pref = await getThemePref();
  return (
    <html lang="en" data-theme={pref === "system" ? "dark" : pref} data-theme-pref={pref} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: systemThemeScript }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
