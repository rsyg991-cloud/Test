/**
 * Validates every full test: the built-in original tests and any licensed JSON files.
 *   npm run validate:tests                 # built-in + content/mock/licensed/*.json (or MOCK_TESTS_DIR)
 *   npm run validate:tests -- path/to.json # specific files
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { builtInTests } from "../content/mock";
import { checkTest } from "../lib/mock/check";

const files = process.argv.slice(2);
const dir = process.env.MOCK_TESTS_DIR || path.join("content", "mock", "licensed");
const targets: { name: string; data: unknown }[] = [];

if (files.length) {
  for (const f of files) targets.push({ name: f, data: JSON.parse(readFileSync(f, "utf8")) });
} else {
  for (const t of builtInTests) targets.push({ name: `${t.id} (built-in)`, data: t });
  if (existsSync(dir)) {
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
      targets.push({ name: path.join(dir, f), data: JSON.parse(readFileSync(path.join(dir, f), "utf8")) });
    }
  }
}

let failed = 0;
for (const { name, data } of targets) {
  const { errors } = checkTest(data, { skipAssetCheck: Boolean(process.env.MOCK_ASSETS_BASE_URL) });
  if (errors.length) {
    failed++;
    console.log(`✗ ${name}\n  - ${errors.join("\n  - ")}`);
  } else {
    const d = data as { reading: { paragraphs: { text: string }[] }[] };
    const words = d.reading.flatMap((p) => p.paragraphs).reduce((a, p) => a + p.text.split(/\s+/).length, 0);
    console.log(`✓ ${name} — 40 listening + 40 reading questions, ${words} reading words`);
  }
}
if (failed) process.exit(1);
