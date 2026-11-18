import { existsSync } from "node:fs";
import path from "node:path";
import { FullTestSchema, type FullTest, type QuestionGroup } from "./schema";

const CHOICE = new Set(["mcq", "mcq-multi", "tfng", "ynng", "matching", "completion-box", "labelling"]);
const TFNG = ["TRUE", "FALSE", "NOT GIVEN"];
const YNNG = ["YES", "NO", "NOT GIVEN"];

function checkGroups(section: string, groups: QuestionGroup[], errors: string[], imageExists: (src: string) => boolean) {
  const numbers = groups.flatMap((g) => g.questions.map((q) => q.n));
  const expected = Array.from({ length: 40 }, (_, i) => i + 1);
  if (numbers.length !== 40) errors.push(`${section}: has ${numbers.length} questions, expected 40.`);
  if (JSON.stringify(numbers) !== JSON.stringify(expected)) errors.push(`${section}: questions must be numbered 1–40 in order.`);

  for (const g of groups) {
    const where = `${section} group "${g.id}"`;
    if (g.type === "mcq-multi" && (!g.prompt || !g.options?.length)) errors.push(`${where}: choose-TWO groups need a prompt and options.`);
    if (["matching", "completion-box", "labelling"].includes(g.type) && !g.options?.length) errors.push(`${where}: needs an options list.`);
    if ((g.type === "completion" || g.type === "short-answer") && !g.wordLimit) errors.push(`${where}: needs a wordLimit (e.g. ONE WORD ONLY).`);
    if (g.type === "labelling" && !g.image) errors.push(`${where}: labelling needs an image.`);
    if (g.image && !imageExists(g.image.src)) errors.push(`${where}: image not found: ${g.image.src}`);
    for (const q of g.questions) {
      const qw = `${section} Q${q.n}`;
      const keys = new Set((q.options ?? g.options ?? []).map((o) => o.key.toUpperCase()));
      if (g.type === "mcq" && !q.options?.length) errors.push(`${qw}: multiple-choice question needs options.`);
      if (CHOICE.has(g.type) && g.type !== "tfng" && g.type !== "ynng") {
        for (const a of q.answer) if (!keys.has(a.toUpperCase())) errors.push(`${qw}: answer "${a}" is not one of the options.`);
      }
      if (g.type === "tfng" && !q.answer.every((a) => TFNG.includes(a))) errors.push(`${qw}: answer must be TRUE, FALSE or NOT GIVEN.`);
      if (g.type === "ynng" && !q.answer.every((a) => YNNG.includes(a))) errors.push(`${qw}: answer must be YES, NO or NOT GIVEN.`);
      if ((g.type === "completion" || g.type === "completion-box") && !q.prompt.includes("___")) errors.push(`${qw}: completion prompt must contain ___ for the gap.`);
      if (!q.prompt && g.type !== "mcq-multi") errors.push(`${qw}: missing prompt text.`);
    }
  }
}

/** Structural checks beyond the schema. Returns a list of problems (empty = valid). */
export function checkTest(
  input: unknown,
  opts: { publicDir?: string; skipAssetCheck?: boolean } = {},
): { test?: FullTest; errors: string[] } {
  const parsed = FullTestSchema.safeParse(input);
  if (!parsed.success) {
    return { errors: parsed.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`) };
  }
  const t = parsed.data;
  const errors: string[] = [];
  const publicDir = opts.publicDir ?? path.join(process.cwd(), "public");
  const imageExists = (src: string) => opts.skipAssetCheck || /^https?:\/\//.test(src) || existsSync(path.join(publicDir, src));

  if (t.source.kind === "licensed" && (!t.source.licenseRef || !t.source.attribution)) {
    errors.push("source: licensed tests must include licenseRef and attribution.");
  }
  t.listening.forEach((p, i) => {
    if (p.part !== i + 1) errors.push(`listening: parts must be 1–4 in order.`);
    if (!p.audioUrl && !p.script?.length) errors.push(`listening part ${p.part}: needs an audioUrl or a script.`);
  });
  t.reading.forEach((p, i) => {
    if (p.passage !== i + 1) errors.push(`reading: passages must be 1–3 in order.`);
  });
  checkGroups("listening", t.listening.flatMap((p) => p.groups), errors, imageExists);
  checkGroups("reading", t.reading.flatMap((p) => p.groups), errors, imageExists);
  const words = t.reading.flatMap((p) => p.paragraphs).reduce((a, p) => a + p.text.split(/\s+/).length, 0);
  if (words < 2000) errors.push(`reading: total length is ${words} words; real tests are about 2150–2750.`);
  if (t.writing.task1.task !== "task1" || t.writing.task2.task !== "task2") errors.push("writing: task1/task2 mismatch.");
  if (!t.writing.task1.chart && !t.writing.task1.image) errors.push("writing task1: needs a chart or an image.");
  if (t.writing.task1.image && !t.writing.task1.imageDescription) errors.push("writing task1: images need an imageDescription for AI grading.");
  return { test: errors.length ? undefined : t, errors };
}
