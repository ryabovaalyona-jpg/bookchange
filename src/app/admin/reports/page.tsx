import Link from "next/link";
import { ADMIN_BUTTON, DATE_TIME } from "@/components/admin-ui";
import { openReports } from "@/server/admin";
import { closeReportAction } from "../actions";

const STATUS = { open: "Открыта", resolved: "Разобрана", dismissed: "Отклонена" } as const;

export default async function AdminReportsPage() {
  const rows = await openReports();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-[28px] leading-tight font-semibold">Жалобы</h1>
      {rows.length === 0 && <p className="text-ink-soft">Жалоб нет.</p>}
      <ul className="flex flex-col gap-3">
        {rows.map((report) => (
          <li key={report.id} className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-3">
            <p className="text-[13px] text-ink-soft">
              {STATUS[report.status]} · {DATE_TIME.format(report.createdAt)}
            </p>
            <p>{report.reason}</p>
            {report.targetType === "book" && (
              <Link href={`/books/${report.targetId}`} className="underline underline-offset-2">
                Книга #{report.targetId}
              </Link>
            )}
            {report.targetType === "user" && (
              <Link href={`/neighbors/${report.targetId}`} className="underline underline-offset-2">
                Участник
              </Link>
            )}
            {report.status === "open" && (
              <form action={closeReportAction} className="flex gap-2">
                <input type="hidden" name="reportId" value={report.id} />
                <button name="status" value="resolved" className={ADMIN_BUTTON}>
                  Разобрана
                </button>
                <button name="status" value="dismissed" className={ADMIN_BUTTON}>
                  Отклонить
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
