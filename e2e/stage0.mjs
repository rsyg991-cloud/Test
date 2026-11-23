// End-to-end test of Stage 0 for a learner starting from zero: register → onboarding ("None, or almost
// none") → /starter → the welcome lesson and Unit 1 lesson 1, speaking skipped → the dashboard sends
// them back to Stage 0. Stage 0 is on by default (unless STAGE0_ENABLED=0).
// Usage: BASE_URL=http://localhost:3000 node e2e/stage0.mjs [screenshotDir]
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const shots = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
page.setDefaultTimeout(8000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const snap = (name) => shots && page.screenshot({ path: `${shots}/${name}.png`, fullPage: true });
const step = (m) => console.log("✓", m);

await page.goto(`${BASE}/register`);
await page.getByLabel("First name").fill("Zero");
await page.getByLabel("Mobile number").fill("05" + String(Math.floor(Math.random() * 1e8)).padStart(8, "0"));
await page.getByLabel("Password").fill("password123");
await page.getByRole("button", { name: "Create my account" }).click();
await page.waitForURL("**/onboarding");
await page.getByRole("radio", { name: /None, or almost none/ }).click();
await page.getByRole("button", { name: /Build my plan/ }).click();
await page.getByRole("button", { name: /Start my journey/ }).click();
await page.waitForURL("**/starter", { timeout: 20000 });
await snap("s0-01-starter");
step("a learner from zero starts at Stage 0");

/** Plays a lesson: Next when possible, Skip on speaking steps, otherwise tries options (a wrong try reveals the answer). */
async function play(lessonId) {
  await page.goto(`${BASE}/starter/${lessonId}`);
  for (let i = 0; i < 400; i++) {
    await page.waitForTimeout(120);
    if (await page.getByText(/Lesson complete/).count()) break;
    const finish = page.getByRole("button", { name: /Finish the lesson/ });
    const next = page.getByRole("button", { name: /^Next$/ });
    const skip = page.getByRole("button", { name: /^Skip$/ });
    if (await skip.count()) {
      await skip.click();
      continue;
    }
    const go = (await finish.count()) ? finish : next;
    if ((await go.count()) && (await go.isEnabled())) {
      await go.click();
      continue;
    }
    const input = page.locator("input[dir=ltr]");
    if (await input.count()) {
      for (let k = 0; k < 2 && !(await go.isEnabled()); k++) {
        await input.fill("zzz");
        await page.getByRole("button", { name: /^Check$/ }).click();
      }
      continue;
    }
    if (await page.getByRole("button", { name: /^Clear$/ }).count()) {
      for (let k = 0; k < 2 && !(await go.isEnabled()); k++) {
        const tiles = page.locator("div[dir=ltr] > button.btn-ghost");
        while (await tiles.count()) await tiles.first().click();
        await page.getByRole("button", { name: /^Check$/ }).click();
        if (!(await go.isEnabled())) await page.getByRole("button", { name: /^Clear$/ }).click();
      }
      continue;
    }
    const opts = page.locator(".card button.card:enabled, .card .btn-marker:enabled, .card p[dir=ltr] button");
    const n = await opts.count();
    if (!n) throw new Error(`No way forward at step ${i} of ${lessonId}`);
    for (let k = 0; k < n && !(await go.isEnabled()); k++) await opts.nth(k).click();
  }
  await page.getByText(/Lesson complete/).waitFor({ timeout: 15000 });
  await snap(`s0-${lessonId}-result`);
  step(`${lessonId} completed (${await page.locator("p.num").first().innerText().catch(() => "no scored steps")})`);
}

await play("z0-u0-l1");
await play("z0-u1-l1");

await page.goto(`${BASE}/starter`);
if ((await page.getByRole("link", { name: /Practise again/ }).count()) < 2) throw new Error("Both lessons should show as done");
await snap("s0-02-starter-progress");
step("progress saved; the next lesson is open");

await page.goto(`${BASE}/starter/review`);
if (!(await page.getByText(/Nothing to review right now/).count())) throw new Error("Straight after two good lessons nothing should be due for review");
step("daily review: nothing due straight after the lessons");

await page.goto(`${BASE}/dashboard`);
if (!page.url().endsWith("/starter")) throw new Error("A Stage 0 learner's dashboard should send them to Stage 0");
step("dashboard sends a Stage 0 learner to Stage 0");

await page.goto(`${BASE}/learn/f1-u1-reading`);
if (!(await page.getByText(/locked/i).count())) throw new Error("Stage 1 should be locked until the Stage 0 unit check is passed");
step("Stage 1 is locked until Stage 0 is passed");

await browser.close();
if (errors.length) {
  console.error("Page errors:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("Stage 0 e2e passed.");
