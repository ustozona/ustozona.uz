import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BASE_URL || "http://localhost:3000";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 45000 });
// scroll through to trigger whileInView animations
for (let y = 0; y < 8; y++) {
  await page.evaluate((i) => window.scrollTo(0, i * window.innerHeight * 0.9), y);
  await page.waitForTimeout(350);
}
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);
await page.screenshot({ path: join(__dirname, "..", "landing-preview.png"), fullPage: true });
await browser.close();
console.log("done");
