import { ADMIN_BUTTON, ADMIN_INPUT } from "@/components/admin-ui";
import { allZones } from "@/server/admin";
import { saveZoneAction } from "../actions";

export default async function AdminZonesPage() {
  const rows = await allZones();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-[28px] leading-tight font-semibold">Зоны района</h1>
      <p className="text-[15px] text-ink-soft">
        ЖК и микрорайоны. Участник выбирает зону только из этого списка. Выключенная зона не
        предлагается новым участникам.
      </p>
      <ul className="flex flex-col gap-2">
        {rows.map((zone) => (
          <li key={zone.id}>
            <form action={saveZoneAction} className="flex flex-wrap items-center gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-3">
              <input type="hidden" name="id" value={zone.id} />
              <input name="name" defaultValue={zone.name} required maxLength={80} aria-label="Название" className={`${ADMIN_INPUT} min-w-0 flex-1`} />
              <input name="sort" type="number" defaultValue={zone.sort} aria-label="Порядок" className={`${ADMIN_INPUT} w-20`} />
              <label className="flex min-h-11 items-center gap-2 text-[15px]">
                <input type="checkbox" name="isActive" defaultChecked={zone.isActive} className="size-5" />
                Активна
              </label>
              <span className="text-[13px] text-ink-soft">участников: {zone.members}</span>
              <button className={ADMIN_BUTTON}>Сохранить</button>
            </form>
          </li>
        ))}
      </ul>
      <form action={saveZoneAction} className="flex flex-wrap gap-2">
        <input name="name" required maxLength={80} placeholder="Новая зона" className={`${ADMIN_INPUT} min-w-0 flex-1`} />
        <input name="sort" type="number" defaultValue={(rows.at(-1)?.sort ?? 0) + 10} aria-label="Порядок" className={`${ADMIN_INPUT} w-20`} />
        <button className={ADMIN_BUTTON}>Добавить</button>
      </form>
    </div>
  );
}
