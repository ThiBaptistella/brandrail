"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { THEME_COOKIE, type ThemePref } from "@/lib/theme";

export async function setThemeAction(formData: FormData): Promise<void> {
  const v = String(formData.get("theme") ?? "dark");
  const pref: ThemePref = v === "light" || v === "system" ? v : "dark";
  (await cookies()).set(THEME_COOKIE, pref, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}
