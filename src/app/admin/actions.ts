"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { closeReport, moderateBook, saveZone, setUserBlocked } from "@/server/admin";
import { requireAdmin } from "@/server/session";

const id = z.coerce.number().int().positive();

export async function moderateBookAction(formData: FormData) {
  await requireAdmin();
  const bookId = id.parse(formData.get("bookId"));
  const action = z.enum(["hide", "remove", "restore"]).parse(formData.get("action"));
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 300);
  await moderateBook(bookId, action, reason);
  revalidatePath("/admin/books");
}

export async function closeReportAction(formData: FormData) {
  await requireAdmin();
  await closeReport(id.parse(formData.get("reportId")), z.enum(["resolved", "dismissed"]).parse(formData.get("status")));
  revalidatePath("/admin/reports");
}

export async function blockUserAction(formData: FormData) {
  await requireAdmin();
  const userId = z.uuid().parse(formData.get("userId"));
  await setUserBlocked(userId, formData.get("blocked") === "1");
  revalidatePath("/admin/users");
}

export async function saveZoneAction(formData: FormData) {
  await requireAdmin();
  const data = z
    .object({
      id: z.union([z.literal(""), id]).optional(),
      name: z.string().trim().min(1).max(80),
      sort: z.coerce.number().int().min(0).max(1000).default(0),
    })
    .parse(Object.fromEntries(formData));
  await saveZone({
    id: data.id || undefined,
    name: data.name,
    sort: data.sort,
    isActive: formData.get("isActive") === "on" || !data.id,
  });
  revalidatePath("/admin/zones");
}
