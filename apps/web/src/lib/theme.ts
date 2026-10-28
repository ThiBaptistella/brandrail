import "server-only";
import { cookies } from "next/headers";

export type ThemePref = "dark" | "light" | "system";
export const THEME_COOKIE = "br_theme";

/** Dark by default (Supabase-style); the user menu can switch to light or system. */
export async function getThemePref(): Promise<ThemePref> {
  const v = (await cookies()).get(THEME_COOKIE)?.value;
  return v === "light" || v === "system" ? v : "dark";
}
