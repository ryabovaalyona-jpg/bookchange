import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { FIELD } from "@/components/form";
import { Button } from "@/components/ui";
import { getBook } from "@/server/books";
import { createReport, REPORT_REASONS } from "@/server/reports";
import { requireMember } from "@/server/session";

export const metadata: Metadata = { title: "Пожаловаться", robots: { index: false } };

export default async function ReportPage({ params, searchParams }: PageProps<"/books/[id]/report">) {
  const { id } = await params;
  const user = await requireMember(`/books/${id}/report`);
  const result = await getBook(Number(id), user);
  if (!result || result.isOwner) notFound();
  const { book } = result;
  const sp = await searchParams;

  async function report(formData: FormData) {
    "use server";
    const reporter = await requireMember(`/books/${book.id}/report`);
    const reason = REPORT_REASONS.find((item) => item.id === formData.get("reason"));
    if (!reason) redirect(`/books/${book.id}/report?error=reason`);
    const details = String(formData.get("details") ?? "").trim().slice(0, 500);
    const ok = await createReport(
      reporter.id,
      { type: "book", id: String(book.id) },
      details ? `${reason.label}: ${details}` : reason.label,
    );
    redirect(`/books/${book.id}/report?${ok ? "sent=1" : "error=limit"}`);
  }

  if (sp.sent) {
    return (
      <div className="flex flex-col gap-4 py-4">
        <h1 className="font-display text-[28px] leading-tight font-semibold">Спасибо</h1>
        <p>Мы посмотрим жалобу. Если что-то не так, книгу снимут с полки.</p>
        <Link href={`/books/${book.id}`} className="underline underline-offset-2">
          Вернуться к книге
        </Link>
      </div>
    );
  }

  return (
    <form action={report} className="flex flex-col gap-4">
      <Link href={`/books/${book.id}`} className="inline-flex min-h-11 items-center text-[15px] text-ink-soft">
        ← {book.title}
      </Link>
      <h1 className="font-display text-[28px] leading-tight font-semibold">Что не так с книгой?</h1>
      {sp.error === "limit" && <p role="alert">Сегодня вы уже отправили много жалоб. Попробуйте завтра.</p>}
      {sp.error === "reason" && <p role="alert">Выберите причину.</p>}
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Причина</legend>
        {REPORT_REASONS.map((reason) => (
          <label
            key={reason.id}
            className="flex min-h-12 cursor-pointer items-center gap-3 rounded-[var(--radius-control)] border border-line bg-surface px-3"
          >
            <input type="radio" name="reason" value={reason.id} required className="size-5 accent-[var(--accent)]" />
            {reason.label}
          </label>
        ))}
      </fieldset>
      <label className="flex flex-col gap-2">
        <span className="text-[15px] font-semibold">Подробнее — по желанию</span>
        <textarea name="details" maxLength={500} rows={3} className={`${FIELD} h-auto py-3`} />
      </label>
      <Button type="submit">Отправить жалобу</Button>
    </form>
  );
}
