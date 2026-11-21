import { normalise } from "@/lib/scoring";
import type { MockQuestion, QuestionGroup, QuestionType } from "./schema";

/** Answers keyed by question number ("7"), or "g:<groupId>" for choose-TWO groups (comma-separated keys). */
export type MockAnswers = Record<string, string>;

export interface MockResult {
  n: number;
  type: QuestionType;
  correct: boolean;
  given: string;
  expected: string;
  explanation?: string;
}

export interface SectionGrade {
  raw: number;
  total: number;
  results: MockResult[];
  byType: Partial<Record<QuestionType, { correct: number; total: number }>>;
}

const CHOICE_TYPES: QuestionType[] = ["mcq", "tfng", "ynng", "matching", "completion-box", "labelling"];

export const multiKey = (groupId: string) => `g:${groupId}`;

/** Count words the way IELTS instructions do: numbers are counted separately when allowed. */
export function withinWordLimit(text: string, limit?: { words: number; number?: boolean }): boolean {
  if (!limit) return true;
  const tokens = text.trim().split(/[\s-]+/).filter(Boolean);
  const numbers = tokens.filter((t) => /^[£$€]?\d[\d.,:/]*(st|nd|rd|th|am|pm|%)?$/i.test(t));
  const words = tokens.length - numbers.length;
  if (limit.number) return words <= limit.words && numbers.length <= 1;
  return tokens.length <= limit.words;
}

function textCorrect(q: MockQuestion, given: string, group: QuestionGroup): boolean {
  if (!given.trim()) return false;
  if (!withinWordLimit(given, group.wordLimit)) return false;
  const g = normalise(given);
  return q.answer.some((a) => normalise(a) === g);
}

function optionText(group: QuestionGroup, q: MockQuestion, key: string) {
  const opt = (q.options ?? group.options ?? []).find((o) => o.key === key);
  return opt ? `${key} — ${opt.text}` : key;
}

export function gradeGroups(groups: QuestionGroup[], answers: MockAnswers): SectionGrade {
  const results: MockResult[] = [];

  for (const group of groups) {
    if (group.type === "mcq-multi") {
      const correctSet = new Set(group.questions.flatMap((q) => q.answer.map((a) => a.toUpperCase())));
      const picked = (answers[multiKey(group.id)] ?? "")
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
        .slice(0, group.questions.length);
      const right = picked.filter((p) => correctSet.has(p)).sort();
      const wrong = picked.filter((p) => !correctSet.has(p));
      const expectedAll = [...correctSet].sort();
      group.questions.forEach((q, i) => {
        const ok = i < right.length;
        results.push({
          n: q.n,
          type: group.type,
          correct: ok,
          given: ok ? right[i] : (wrong[i - right.length] ?? ""),
          expected: expectedAll.map((k) => optionText(group, q, k)).join(" / "),
          explanation: q.explanation,
        });
      });
      continue;
    }

    for (const q of group.questions) {
      const given = (answers[String(q.n)] ?? "").trim();
      const correct = CHOICE_TYPES.includes(group.type)
        ? q.answer.some((a) => a.toUpperCase() === given.toUpperCase())
        : textCorrect(q, given, group);
      results.push({
        n: q.n,
        type: group.type,
        correct,
        given: CHOICE_TYPES.includes(group.type) && given ? optionText(group, q, given) : given,
        expected: CHOICE_TYPES.includes(group.type) ? optionText(group, q, q.answer[0]) : q.answer[0],
        explanation: q.explanation,
      });
    }
  }

  results.sort((a, b) => a.n - b.n);
  const byType: SectionGrade["byType"] = {};
  for (const r of results) {
    const t = (byType[r.type] ??= { correct: 0, total: 0 });
    t.total++;
    if (r.correct) t.correct++;
  }
  return { raw: results.filter((r) => r.correct).length, total: results.length, results, byType };
}

export const TYPE_LABELS: Record<QuestionType, string> = {
  mcq: "Multiple choice",
  "mcq-multi": "Multiple choice (choose TWO)",
  tfng: "True / False / Not Given",
  ynng: "Yes / No / Not Given",
  matching: "Matching",
  completion: "Completion (notes, sentences, summary)",
  "completion-box": "Summary completion (word box)",
  labelling: "Map / diagram labelling",
  "short-answer": "Short answer",
};

/** Question numbers that have an answer (choose-TWO groups count one number per pick). */
export function answeredNumbers(groups: QuestionGroup[], answers: MockAnswers): Set<number> {
  const s = new Set<number>();
  for (const g of groups) {
    if (g.type === "mcq-multi") {
      const picked = (answers[multiKey(g.id)] ?? "").split(",").filter(Boolean).length;
      g.questions.slice(0, picked).forEach((q) => s.add(q.n));
    } else g.questions.forEach((q) => answers[String(q.n)]?.trim() && s.add(q.n));
  }
  return s;
}
