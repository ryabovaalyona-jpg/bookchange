"use server";

import { cookies } from "next/headers";
import { STYLE_COOKIE, STYLE_VARIANTS } from "@/lib/style-variant";

export async function setStyleVariant(formData: FormData) {
  const value = formData.get("style");
  if (!STYLE_VARIANTS.some((v) => v.id === value)) return;
  (await cookies()).set(STYLE_COOKIE, value as string, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  });
}
