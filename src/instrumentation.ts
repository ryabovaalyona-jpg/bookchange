// При старте сервера подключаемся к базе и применяем миграции (PRD, раздел 11):
// ошибка миграции видна сразу, а не на первом запросе участника.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { getDb } = await import("./db");
  await getDb();
}
