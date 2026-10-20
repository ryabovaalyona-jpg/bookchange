import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const env = {
  PGLITE_DIR: ".data/e2e-pglite",
  UPLOAD_DIR: ".data/e2e-uploads",
  NEXT_DIST_DIR: ".next-e2e",
  AUTH_DEV_PROVIDER: "1",
  APP_URL: `http://localhost:${PORT}`,
  ADMIN_EMAILS: "",
};

// Сквозные тесты — пункты «Готово, когда» фазы 1 (PRD, раздел 6).
// Браузер — установленный Chrome, без скачивания своих браузеров Playwright.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  workers: 1,
  use: { baseURL: `http://localhost:${PORT}`, ...devices["Pixel 7"], channel: "chrome" },
  webServer: {
    command: `tsx --conditions=react-server scripts/e2e-prepare.ts && next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    env,
    timeout: 180_000,
    reuseExistingServer: false,
  },
});
