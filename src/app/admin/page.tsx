import { dailyCounters, totals } from "@/server/admin";

export default async function AdminPage() {
  const [sum, days] = await Promise.all([totals(), dailyCounters(14)]);
  const tiles = [
    { label: "Участников", value: sum.members },
    { label: "Книг на полке", value: sum.books },
    { label: "Книг на участника", value: sum.booksPerOwner },
    { label: "Нажатий «Хочу»", value: sum.interests },
    { label: "Открытых жалоб", value: sum.openReports },
  ];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-[28px] leading-tight font-semibold">Счётчики</h1>
      <p className="text-[15px] text-ink-soft">
        Гейт A: не меньше 15 человек выложили не меньше 200 книг. Сейчас: {sum.owners} чел., {sum.books} кн.
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((tile) => (
          <li key={tile.label} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
            <p className="font-display text-3xl font-semibold">{tile.value}</p>
            <p className="text-[13px] text-ink-soft">{tile.label}</p>
          </li>
        ))}
      </ul>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[15px]">
          <caption className="mb-2 text-left font-semibold">По дням, 14 дней</caption>
          <thead className="text-ink-soft">
            <tr>
              <th className="py-2 pr-3 font-medium">День</th>
              <th className="py-2 pr-3 font-medium">Новые участники</th>
              <th className="py-2 pr-3 font-medium">Новые книги</th>
              <th className="py-2 font-medium">«Хочу»</th>
            </tr>
          </thead>
          <tbody>
            {days.map((row) => (
              <tr key={row.day} className="border-t border-line">
                <td className="py-2 pr-3">{row.day}</td>
                <td className="py-2 pr-3">{row.users}</td>
                <td className="py-2 pr-3">{row.books}</td>
                <td className="py-2">{row.interests}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
