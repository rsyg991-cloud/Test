/**
 * Copies the Fluent Emoji (flat, MIT) pictures the content uses into public/emoji/<code points>.svg.
 * Re-run after adding a picture to the content: npx tsx scripts/emoji/build.ts
 * tests/emoji.test.ts fails if a picture the content uses has no file.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { stage0Items } from "@/content/stage0";
import { emojiKey, emojiParts } from "@/lib/emoji";

const require = createRequire(import.meta.url);
const set = require("@iconify-json/fluent-emoji-flat/icons.json") as {
  width?: number;
  height?: number;
  icons: Record<string, { body: string; width?: number; height?: number }>;
  aliases?: Record<string, { parent: string }>;
};
const chars = require("@iconify-json/fluent-emoji-flat/chars.json") as Record<string, string>;

const out = join(process.cwd(), "public", "emoji");
mkdirSync(out, { recursive: true });
const used = new Map<string, string>();
for (const x of stage0Items as { image?: string }[]) for (const p of emojiParts(x.image ?? "")) if (p.kind === "emoji") used.set(emojiKey(p.char), p.char);

const missing: string[] = [];
for (const [key, char] of used) {
  const name = chars[key] ?? chars[key.replace(/^0+/, "")];
  const icon = name && (set.icons[name] ?? set.icons[set.aliases?.[name]?.parent ?? ""]);
  if (!icon) {
    missing.push(`${char} ${key}`);
    continue;
  }
  const w = icon.width ?? set.width ?? 16;
  const h = icon.height ?? set.height ?? 16;
  writeFileSync(join(out, `${key}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${icon.body}</svg>\n`);
}
console.log(`${used.size - missing.length} pictures written to public/emoji`);
if (missing.length) {
  console.error(`No Fluent Emoji for: ${missing.join(", ")}`);
  process.exit(1);
}
