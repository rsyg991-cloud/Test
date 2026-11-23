/**
 * Prints the list of texts to record (lib/audio/manifest.ts) as JSON, for scripts/audio/generate.py.
 * Usage: npx tsx scripts/audio/manifest.ts > /tmp/audio-manifest.json
 */
import { spokenTexts } from "@/lib/audio/manifest";

const list = spokenTexts();
process.stdout.write(JSON.stringify(list));
console.error(`${list.length} texts, ${list.reduce((n, x) => n + x.text.split(/\s+/).length, 0)} words`);
