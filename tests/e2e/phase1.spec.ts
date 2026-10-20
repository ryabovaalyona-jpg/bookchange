import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

// «Готово, когда» фазы 1 (PRD, раздел 6):
// вход через подставного провайдера → знакомство → книга с фото → гость находит её поиском
// с опечаткой; в сохранённых фото нет метаданных; ответы гостю без закрытых данных.

const run = Date.now().toString(36);
const member = {
  uid: `e2e-${run}`,
  email: `e2e-${run}@example.test`,
  contact: `@neighbor_${run}`,
  name: "Евгения",
};
const title = `Пушистик и облако ${run}`;

async function photoWithGps() {
  return sharp({ create: { width: 900, height: 1200, channels: 3, background: "#48615f" } })
    .withExif({
      IFD0: { Make: "TestCam", Model: "Secret Phone" },
      IFD3: { GPSLatitudeRef: "N", GPSLatitude: "55/1 49/1 0/1", GPSLongitudeRef: "E", GPSLongitude: "37/1 19/1 0/1" },
    })
    .jpeg()
    .toBuffer();
}

/** Подсказки каталога в тесте не нужны: наружу не ходим. */
async function noCatalog(page: Page) {
  await page.route("**/api/book-lookup?**", (route) => route.fulfill({ json: { suggestions: [] } }));
}

let bookUrl = "";

test("участник входит, знакомится и выкладывает книгу с фото", async ({ page, request }) => {
  await noCatalog(page);
  await page.goto("/add");
  await expect(page).toHaveURL(/\/login/);
  await page.getByRole("link", { name: /Войти через/ }).click();

  await page.getByLabel("Идентификатор у провайдера").fill(member.uid);
  await page.getByLabel("Имя").fill(member.name);
  await page.getByLabel("Почта (можно пустую)").fill(member.email);
  await page.getByRole("button", { name: "Войти" }).click();

  await expect(page.getByRole("heading", { name: "Давайте познакомимся" })).toBeVisible();
  await page.getByLabel("Как вас называть").fill(member.name);
  await page.getByLabel("Где вы живёте").selectOption({ label: "Тестовый квартал" });
  await page.getByLabel(/Как с вами связаться/).fill(member.contact);
  await page.getByLabel("Мне есть 18 лет").check();
  await page.getByLabel(/Даю согласие/).check();
  await page.getByLabel(/Принимаю/).check();
  await page.getByRole("button", { name: "Готово" }).click();

  await expect(page.getByRole("heading", { name: "Выложить книгу" })).toBeVisible();
  await page.getByLabel("Название книги").fill(title);
  await page.getByTestId("photo-input").setInputFiles({
    name: "cover.jpg",
    mimeType: "image/jpeg",
    buffer: await photoWithGps(),
  });
  await expect(page.getByRole("button", { name: "Убрать фото 1" })).toBeVisible();
  await page.getByRole("button", { name: "5–6", exact: true }).click();
  await page.getByText("Хорошее", { exact: true }).click();
  await page.getByRole("button", { name: "Выложить книгу" }).click();

  await expect(page.getByRole("status")).toHaveText("Книга на полке");
  await page.getByRole("link", { name: "Открыть книгу" }).click();
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  bookUrl = new URL(page.url()).pathname;

  // В сохранённых файлах нет метаданных, включая координаты.
  const src = await page.getByRole("img", { name: `Обложка: ${title}` }).getAttribute("src");
  expect(src).toMatch(/^\/media\/books\/\d+\/[0-9a-f]+-800\.webp$/);
  for (const width of [320, 800, 1600]) {
    const response = await request.get(src!.replace("-800.webp", `-${width}.webp`));
    expect(response.ok()).toBe(true);
    const file = await response.body();
    const meta = await sharp(file).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.exif).toBeUndefined();
    expect(meta.xmp).toBeUndefined();
    expect(file.includes(Buffer.from("Secret Phone"))).toBe(false);
  }
});

test("гость находит книгу поиском с опечаткой и не получает закрытых данных", async ({ browser }) => {
  expect(bookUrl).not.toBe("");
  const context = await browser.newContext();
  const page = await context.newPage();
  await noCatalog(page);

  const bodies: string[] = [];
  page.on("response", async (response) => {
    const type = response.headers()["content-type"] ?? "";
    if (/text|json|javascript|x-component/.test(type)) {
      try {
        bodies.push(await response.text());
      } catch {
        // Ответ без тела (редирект) — проверять нечего.
      }
    }
  });

  await page.goto("/");
  // «Пушистек» вместо «Пушистик».
  await page.getByLabel("Поиск по названию и автору").fill(`Пушистек и облоко ${run}`);
  await page.getByLabel("Поиск по названию и автору").press("Enter");
  await expect(page.getByRole("heading", { name: "Нашлось" })).toBeVisible();
  await page.getByRole("link", { name: new RegExp(title) }).first().click();
  await expect(page).toHaveURL(new RegExp(`${bookUrl}$`));
  await expect(page.getByRole("heading", { name: title })).toBeVisible();

  await page.getByRole("link", { name: member.name }).click();
  await expect(page.getByRole("heading", { name: member.name })).toBeVisible();
  await page.goto(bookUrl);

  const all = bodies.join("\n");
  expect(all.length).toBeGreaterThan(1000);
  expect(all).not.toContain(member.email);
  expect(all).not.toContain(member.contact);
  expect(all).not.toContain(member.uid);
  await context.close();
});
