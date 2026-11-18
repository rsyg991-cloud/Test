import type { Question, Skill } from "@/content/types";

export type Answers = Record<string, string | number | undefined>;

export interface QuestionResult {
  id: string;
  correct: boolean;
  given: string;
  expected: string;
  explanation: string;
}

export function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[£$%°]/g, "")
    .replace(/(\d),(\d)/g, "$1$2")
    .replace(/[.,!?;:'"’]+$/g, "")
    .replace(/^(the|a|an)\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function expectedText(q: Question): string {
  if (q.type === "mcq") return q.options[q.answer];
  if (q.type === "tfng") return q.answer;
  return q.answer[0];
}

export function isCorrect(q: Question, given: string | number | undefined): boolean {
  if (given === undefined || given === "") return false;
  if (q.type === "mcq") return Number(given) === q.answer;
  if (q.type === "tfng") return String(given).toUpperCase() === q.answer;
  const g = normalise(String(given));
  return q.answer.some((a) => normalise(a) === g);
}

export function gradeQuestions(questions: Question[], answers: Answers) {
  const results: QuestionResult[] = questions.map((q) => {
    const given = answers[q.id];
    return {
      id: q.id,
      correct: isCorrect(q, given),
      given:
        q.type === "mcq" && given !== undefined && given !== ""
          ? (q.options[Number(given)] ?? "")
          : String(given ?? ""),
      expected: expectedText(q),
      explanation: q.explanation,
    };
  });
  const correct = results.filter((r) => r.correct).length;
  const total = questions.length;
  return { results, correct, total, pct: total ? correct / total : 0 };
}

/** Round to the nearest half band, with .25/.75 rounding up (official IELTS rule). */
export function roundBand(x: number): number {
  const r = Math.floor(x * 2 + 0.5 + 1e-9) / 2;
  return Math.min(9, Math.max(0, r));
}

/** Overall band = mean of the four skills, rounded the IELTS way. */
export function overallBand(bands: Partial<Record<Skill, number | null>>): number | null {
  const vals = Object.values(bands).filter((b): b is number => typeof b === "number");
  if (vals.length === 0) return null;
  return roundBand(vals.reduce((a, b) => a + b, 0) / vals.length);
}

/** Difficulty window used to translate an auto-scored percentage into a band, per stage. */
const STAGE_WINDOWS: Record<number, [number, number]> = {
  0: [3.5, 7.0], // placement
  1: [3.5, 6.0],
  2: [4.5, 7.0],
  3: [5.5, 8.0],
  4: [6.0, 9.0],
};

export function bandFromScore(pct: number, stage: number): number {
  const [lo, hi] = STAGE_WINDOWS[stage] ?? STAGE_WINDOWS[1];
  const p = Math.min(1, Math.max(0, pct));
  return roundBand(lo + p * (hi - lo));
}

export function clampBand(x: unknown): number {
  const n = typeof x === "number" && Number.isFinite(x) ? x : 5;
  return roundBand(Math.min(9, Math.max(1, n)));
}

/** Weighted estimate from recent snapshots (newest first). */
export function estimateSkillBand(
  snapshots: { band: number; source: string }[],
): number | null {
  if (snapshots.length === 0) return null;
  const recent = snapshots.slice(0, 6);
  let sum = 0;
  let weight = 0;
  recent.forEach((s, i) => {
    const sourceWeight = s.source === "checkpoint" ? 2 : s.source === "placement" ? 1 : 1.2;
    const w = sourceWeight * Math.pow(0.8, i);
    sum += s.band * w;
    weight += w;
  });
  return roundBand(sum / weight);
}

export function cefrForBand(b: number | null): string {
  if (b === null) return "—";
  if (b >= 8) return "C2";
  if (b >= 7) return "C1";
  if (b >= 5.5) return "B2";
  if (b >= 4) return "B1";
  return "A2";
}
