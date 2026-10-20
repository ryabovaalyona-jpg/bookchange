import { NextResponse } from "next/server";
import { logEvent } from "@/server/events";
import { getCurrentUser } from "@/server/session";

const ANIMI_URL =
  "https://animistories.com/?utm_source=knizhki-po-sosedstvu&utm_medium=footer&utm_campaign=pilot";

// Нажатия на ссылку ANIMI пишутся в events (PRD, раздел 13). Наружу уходит только переход.
export async function GET() {
  const user = await getCurrentUser();
  await logEvent("animi_click", user?.id ?? null, { place: "footer" });
  return NextResponse.redirect(ANIMI_URL);
}
