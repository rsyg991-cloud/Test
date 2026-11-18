import { describe, expect, it } from "vitest";
import { builtInTests } from "@/content/mock";
import { academicReadingBand, listeningBand, writingBand } from "@/lib/mock/bands";
import { checkTest } from "@/lib/mock/check";
import { gradeGroups, multiKey, withinWordLimit, type MockAnswers } from "@/lib/mock/grade";
import type { QuestionGroup } from "@/lib/mock/schema";

const test = builtInTests[0];
const lGroups = test.listening.flatMap((p) => p.groups);
const rGroups = test.reading.flatMap((p) => p.groups);

/** Build a perfect answer sheet from the answer key. */
function perfect(groups: QuestionGroup[]): MockAnswers {
  const a: MockAnswers = {};
  for (const g of groups) {
    if (g.type === "mcq-multi") a[multiKey(g.id)] = g.questions[0].answer.join(",");
    else for (const q of g.questions) a[String(q.n)] = q.answer[0];
  }
  return a;
}

describe("original full test", () => {
  it("passes the validator with 40 + 40 questions and real-length reading", () => {
    const { errors } = checkTest(test);
    expect(errors).toEqual([]);
    expect(lGroups.flatMap((g) => g.questions)).toHaveLength(40);
    expect(rGroups.flatMap((g) => g.questions)).toHaveLength(40);
  });

  it("uses the full range of official question types", () => {
    const types = new Set([...lGroups, ...rGroups].map((g) => g.type));
    for (const t of ["mcq", "mcq-multi", "tfng", "ynng", "matching", "completion", "completion-box", "labelling"]) expect(types).toContain(t);
  });

  it("scores 40/40 on its own answer key and 0 on a blank sheet", () => {
    expect(gradeGroups(lGroups, perfect(lGroups)).raw).toBe(40);
    expect(gradeGroups(rGroups, perfect(rGroups)).raw).toBe(40);
    expect(gradeGroups(lGroups, {}).raw).toBe(0);
  });
});

describe("grading rules", () => {
  const g = (over: Partial<QuestionGroup>): QuestionGroup => ({ id: "g", type: "completion", instructions: "x", questions: [{ n: 1, prompt: "___", answer: ["14", "fourteenth"] }], ...over }) as QuestionGroup;

  it("enforces word limits like the real test", () => {
    expect(withinWordLimit("water", { words: 1, number: false })).toBe(true);
    expect(withinWordLimit("cold water", { words: 1, number: false })).toBe(false);
    expect(withinWordLimit("14 March", { words: 1, number: true })).toBe(true);
    expect(withinWordLimit("the 14 March", { words: 1, number: true })).toBe(false);
    const group = g({ wordLimit: { words: 1, number: false }, questions: [{ n: 1, prompt: "___", answer: ["water"] }] });
    expect(gradeGroups([group], { "1": "Water" }).raw).toBe(1);
    expect(gradeGroups([group], { "1": "salt water" }).raw).toBe(0);
  });

  it("accepts listed alternatives and ignores case", () => {
    const group = g({ wordLimit: { words: 1, number: true } });
    expect(gradeGroups([group], { "1": "Fourteenth" }).raw).toBe(1);
    expect(gradeGroups([group], { "1": "15" }).raw).toBe(0);
  });

  it("gives one mark per correct letter in choose-TWO questions, in any order", () => {
    const multi = lGroups.find((x) => x.type === "mcq-multi")!;
    const [a, b] = multi.questions[0].answer;
    const wrong = multi.options!.map((o) => o.key).find((k) => k !== a && k !== b)!;
    expect(gradeGroups([multi], { [multiKey(multi.id)]: `${b},${a}` }).raw).toBe(2);
    expect(gradeGroups([multi], { [multiKey(multi.id)]: `${a},${wrong}` }).raw).toBe(1);
    expect(gradeGroups([multi], { [multiKey(multi.id)]: wrong }).raw).toBe(0);
  });

  it("reports accuracy by question type", () => {
    const res = gradeGroups(rGroups, perfect(rGroups));
    expect(res.byType.tfng).toEqual({ correct: 7, total: 7 });
    expect(res.byType.ynng?.total).toBe(5);
  });
});

describe("band conversion tables", () => {
  it("matches the published cut-offs", () => {
    expect(listeningBand(40)).toBe(9);
    expect(listeningBand(30)).toBe(7);
    expect(listeningBand(29)).toBe(6.5);
    expect(listeningBand(23)).toBe(6);
    expect(listeningBand(0)).toBe(0);
    expect(academicReadingBand(30)).toBe(7);
    expect(academicReadingBand(33)).toBe(7.5);
    expect(academicReadingBand(27)).toBe(6.5);
    expect(academicReadingBand(15)).toBe(5);
  });
  it("weights Writing Task 2 double", () => {
    expect(writingBand(6, 7)).toBe(6.5); // 6.67 → 6.5
    expect(writingBand(5, 7)).toBe(6.5); // 6.33 → 6.5
    expect(writingBand(null, 6)).toBe(6);
    expect(writingBand(null, null)).toBeNull();
  });
});

describe("validator for imported tests", () => {
  it("rejects incomplete or unattributed licensed tests", () => {
    const broken = structuredClone(test) as unknown as { source: Record<string, unknown>; reading: { groups: { questions: unknown[] }[] }[] };
    broken.source = { kind: "licensed" };
    broken.reading[2].groups[0].questions.pop();
    const { errors } = checkTest(broken);
    expect(errors.some((e) => e.includes("licenseRef and attribution"))).toBe(true);
    expect(errors.some((e) => e.includes("reading: has 39 questions"))).toBe(true);
  });
  it("rejects answers that are not among the options and missing images", () => {
    const broken = structuredClone(test);
    broken.listening[1].groups[1].questions[0].answer = ["Z"];
    broken.listening[1].groups[1].image = { src: "/missing.svg", alt: "x" };
    const { errors } = checkTest(broken);
    expect(errors.some((e) => e.includes('answer "Z"'))).toBe(true);
    expect(errors.some((e) => e.includes("image not found"))).toBe(true);
  });
});
