import { chromium } from "playwright";

const BASE = process.env.WEB_BASE || "https://rahatomir.com";
const TIMEOUT = 120_000;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  const logs = [];

  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}\n${e.stack ?? ""}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });

  console.log(`Loading ${BASE} ...`);
  await page.goto(BASE, { waitUntil: "networkidle", timeout: TIMEOUT });

  // Wait for boot splash to disappear (app mounted)
  await page.waitForFunction(
    () => !document.getElementById("raqat-web-boot") || document.querySelector("[data-testid='raqat-app-root']"),
    { timeout: TIMEOUT }
  ).catch(() => {});

  await page.waitForTimeout(3000);
  console.log("URL after boot:", page.url());

  // Direct deep link tests
  for (const path of ["/more/namaz-guide", "/more/tajweed", "/more/quran"]) {
    console.log(`\n--- Direct: ${path} ---`);
    errors.length = 0;
    await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: TIMEOUT });
    await page.waitForTimeout(5000);
    const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 500) ?? "");
    console.log("URL:", page.url());
    console.log("Body snippet:", bodyText.replace(/\s+/g, " ").slice(0, 200));
    if (errors.length) console.log("Errors:", errors.slice(0, 5));
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
