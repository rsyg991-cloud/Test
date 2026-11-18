import "server-only";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { builtInTests } from "@/content/mock";
import { checkTest } from "./check";
import type { FullTest, MockWritingTask } from "./schema";

/** Folder for licensed tests (JSON). Override with MOCK_TESTS_DIR to keep them outside the repository. */
const licensedDir = () => process.env.MOCK_TESTS_DIR || path.join(process.cwd(), "content", "mock", "licensed");

/** Prefix relative asset paths of licensed tests (audio, images) with MOCK_ASSETS_BASE_URL, if set. */
function withAssetBase(t: FullTest): FullTest {
  const base = process.env.MOCK_ASSETS_BASE_URL?.replace(/\/$/, "");
  if (!base) return t;
  const fix = (src?: string) => (src && !/^https?:\/\//.test(src) ? `${base}/${src.replace(/^\//, "")}` : src);
  return {
    ...t,
    listening: t.listening.map((p) => ({ ...p, audioUrl: fix(p.audioUrl), groups: p.groups.map((g) => (g.image ? { ...g, image: { ...g.image, src: fix(g.image.src)! } } : g)) })),
    reading: t.reading.map((p) => ({ ...p, groups: p.groups.map((g) => (g.image ? { ...g, image: { ...g.image, src: fix(g.image.src)! } } : g)) })),
  };
}

let cache: FullTest[] | null = null;

function loadLicensed(): FullTest[] {
  const dir = licensedDir();
  if (!existsSync(dir)) return [];
  const tests: FullTest[] = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    try {
      // Assets on remote storage (MOCK_ASSETS_BASE_URL) can't be checked on disk.
      const { test, errors } = checkTest(JSON.parse(readFileSync(path.join(dir, file), "utf8")), {
        skipAssetCheck: Boolean(process.env.MOCK_ASSETS_BASE_URL),
      });
      if (test && test.source.kind === "licensed") tests.push(withAssetBase(test));
      else console.warn(`[mock] Skipping ${file}:\n  ${errors.join("\n  ") || "source.kind must be 'licensed'"}`);
    } catch (e) {
      console.warn(`[mock] Skipping ${file}: ${(e as Error).message}`);
    }
  }
  return tests;
}

export function getAllTests(): FullTest[] {
  if (!cache || process.env.NODE_ENV !== "production") cache = [...builtInTests, ...loadLicensed()];
  return cache;
}

export function getTest(id: string): FullTest | undefined {
  return getAllTests().find((t) => t.id === id);
}

/** Resolve "<testId>:task1" / ":task2" / ":speaking-1|2|3" refs used by the evaluation API. */
export function getMockWritingTask(ref: string): MockWritingTask | undefined {
  const [id, part] = ref.split(":");
  const t = getTest(id);
  if (!t) return undefined;
  if (part === "task1") return t.writing.task1;
  if (part === "task2") return t.writing.task2;
  return undefined;
}

export function getMockSpeakingPart(ref: string) {
  const [id, part] = ref.split(":");
  const t = getTest(id);
  if (!t) return undefined;
  if (part === "speaking-1") return { part: 1 as const, questions: t.speaking.part1, prepSeconds: 0, speakSeconds: 30 };
  if (part === "speaking-2")
    return { part: 2 as const, questions: [t.speaking.part2.topic], cueCard: t.speaking.part2, prepSeconds: 60, speakSeconds: 120 };
  if (part === "speaking-3") return { part: 3 as const, questions: t.speaking.part3, prepSeconds: 0, speakSeconds: 60 };
  return undefined;
}

/** Copy of a test that is safe to send to the browser: no answers or explanations (grading happens on the server). */
export function toClientTest(t: FullTest): FullTest {
  const strip = <G extends { questions: { answer: string[]; explanation?: string }[] }>(g: G): G => ({
    ...g,
    questions: g.questions.map((q) => ({ ...q, answer: [], explanation: undefined })),
  });
  return {
    ...t,
    listening: t.listening.map((p) => ({ ...p, groups: p.groups.map(strip) })),
    reading: t.reading.map((p) => ({ ...p, groups: p.groups.map(strip) })),
  };
}
