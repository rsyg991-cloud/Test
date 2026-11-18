// End-to-end smoke test: register → placement → plan → lesson → dashboard.
// Usage: BASE_URL=http://localhost:3000 node e2e/smoke.mjs [screenshotDir]
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const shots = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const snap = async (name) => shots && page.screenshot({ path: `${shots}/${name}.png`, fullPage: true });
const step = (m) => console.log("✓", m);

await page.goto(BASE);
await page.getByRole("heading", { name: /one camp/i }).waitFor();
await snap("01-landing");
step("landing page");

const email = `e2e+${Date.now()}@example.com`;
await page.goto(`${BASE}/register`);
await page.getByLabel("First name").fill("Test");
await page.getByLabel("Email").fill(email);
await page.getByLabel("Password").fill("password123");
await page.getByRole("button", { name: "Create my account" }).click();
await page.waitForURL("**/onboarding");
step("registered");

// Goal
await page.getByRole("radio", { name: "7.0" }).click();
await snap("02-onboarding-goal");
await page.getByRole("button", { name: /Start the placement test/ }).click();
// Grammar: choose B for every question
for (const group of await page.getByRole("radiogroup").all()) await group.getByRole("radio").nth(1).click();
await page.getByRole("button", { name: "Continue" }).click();
// Reading
await page.getByRole("heading", { name: "Reading" }).waitFor();
for (const group of await page.getByRole("radiogroup").all()) await group.getByRole("radio").first().click();
await page.locator("input[aria-label*='blank']").first().fill("46");
await page.getByRole("button", { name: "Continue" }).click();
// Listening
await page.getByRole("heading", { name: "Listening" }).waitFor();
const gaps = page.locator("input[aria-label*='blank']");
for (const [i, v] of ["Thursday", "12", "3", "food"].entries()) await gaps.nth(i).fill(v);
await page.getByRole("button", { name: "Continue" }).click();
// Writing (offline evaluator when AI_MOCK=1)
await page.getByRole("heading", { name: "Writing" }).waitFor();
await page.getByLabel("Your answer").fill(
  "In my opinion, studying in a group is more effective than studying alone. Firstly, group members can explain difficult ideas to each other. For example, when I prepared for my chemistry exam, my friend helped me understand reactions. However, groups can sometimes be distracting. Therefore, I prefer small groups with clear goals. In conclusion, I believe group study is better for most students.",
);
await page.getByRole("button", { name: /Get my band score/ }).click();
await page.getByLabel("Examiner feedback").waitFor({ timeout: 90_000 });
await snap("03-writing-feedback");
step("writing evaluated");
await page.getByRole("button", { name: "Continue" }).click();
// Speaking: skip
await page.getByRole("button", { name: /Skip speaking/ }).click();
await page.getByText("Your starting point").waitFor();
await snap("04-placement-results");
step("placement results");
await page.getByRole("button", { name: /Choose my plan/ }).click();
await page.getByRole("radio", { name: /3\s*months/ }).click();
await snap("05-plan-picker");
await page.getByRole("button", { name: /Start my journey/ }).click();
await page.waitForURL("**/dashboard**");
await snap("06-dashboard-new");
step("plan saved, dashboard loaded");

// First lesson: reading
await page.goto(`${BASE}/learn/s1-u1-reading`);
await snap("07-lesson-learn");
await page.getByRole("button", { name: /start the task/ }).click();
const answers = { q2: "80", q3: "70,000", q4: "2007" };
for (const [i, group] of (await page.getByRole("radiogroup").all()).entries()) await group.getByRole("radio").nth([1, 2, 2][i] ?? 0).click();
const lgaps = page.locator("input[aria-label*='blank']");
for (const [i, v] of Object.values(answers).entries()) await lgaps.nth(i).fill(v);
await snap("08-lesson-task");
await page.getByRole("button", { name: /Check answers/ }).click();
await page.getByRole("dialog").waitFor();
await snap("09-lesson-celebration");
const dialogText = await page.getByRole("dialog").innerText();
if (!dialogText.includes("6/6")) throw new Error("Expected 6/6 correct, got: " + dialogText);
step("lesson completed 6/6 with celebration");

await page.goto(`${BASE}/dashboard`);
const header = await page.locator("aside").innerText();
if (!/XP/.test(header)) throw new Error("XP missing");
const xp = Number(header.match(/([\d,]+) XP/)[1].replace(/,/g, ""));
if (!(xp > 0)) throw new Error("XP did not increase");
step(`dashboard shows ${xp} XP and streak`);

for (const p of ["journey", "vocab", "progress", "plan", "practice"]) {
  await page.goto(`${BASE}/${p}`);
  await page.locator("main h1").first().waitFor();
  await snap(`10-${p}`);
}
step("all app pages render");

// Mobile check
const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await m.goto(BASE);
const overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
if (overflow > 1) throw new Error(`Landing page scrolls horizontally on mobile by ${overflow}px`);
if (shots) await m.screenshot({ path: `${shots}/11-mobile-landing.png`, fullPage: false });
step("mobile landing has no horizontal scroll");

if (errors.length) throw new Error("Page errors:\n" + errors.join("\n"));
await browser.close();
console.log("All smoke checks passed.");
