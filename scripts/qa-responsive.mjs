import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const root = process.cwd();
const outputDir = path.join(root, ".qa");
const targetUrl = process.env.QA_URL ?? "http://localhost:3000";
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
});

const viewports = [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
];

const results = [];

for (const viewport of viewports) {
  const page = await browser.newPage({
    viewport: { width: viewport.width, height: viewport.height },
  });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("A tree hydrated but some attributes")) {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForFunction(() => {
    const shell = document.querySelector(".mentora-shell, .landing-page, main");
    if (!shell) {
      return false;
    }

    return Number.parseFloat(window.getComputedStyle(shell).opacity || "1") > 0.95;
  }, { timeout: 10_000 });
  await page.waitForTimeout(900);
  const text = await page.locator("body").innerText({ timeout: 5_000 });
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollHeight: document.documentElement.scrollHeight,
    clientHeight: document.documentElement.clientHeight,
    interactiveControls: document.querySelectorAll("button, a, input, label").length,
  }));

  const screenshot = path.join(outputDir, `${viewport.name}.png`);
  await page.screenshot({ path: screenshot, fullPage: false });
  await page.close();

  results.push({
    viewport,
    screenshot,
    textPreview: text.slice(0, 900),
    metrics,
    hasHorizontalOverflow: metrics.scrollWidth > metrics.clientWidth,
    errors,
  });
}

await browser.close();
console.log(JSON.stringify(results, null, 2));

if (results.some((result) => result.hasHorizontalOverflow || result.errors.length > 0)) {
  process.exitCode = 1;
}
