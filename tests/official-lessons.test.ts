import { describe, expect, it } from "vitest";
import { allLessons, stages } from "@/content";
import { checkQuestionGroups } from "@/lib/mock/check";
import { gradeGroups, multiKey, type MockAnswers } from "@/lib/mock/grade";
import type { QuestionGroup } from "@/lib/mock/schema";
import { gradeTask, taskAnsweredCount, taskQuestionCount } from "@/lib/taskGrade";

const perfect = (groups: QuestionGroup[]): MockAnswers => {
  const a: MockAnswers = {};
  for (const g of groups) {
    if (g.type === "mcq-multi") a[multiKey(g.id)] = g.questions[0].answer.join(",");
    else for (const q of g.questions) a[String(q.n)] = q.answer[0];
  }
  return a;
};

const tasks = [
  ...allLessons.filter((l) => l.stage >= 6 && (l.reading || l.listening)).map((l) => ({ id: l.id, task: (l.reading ?? l.listening)! })),
  ...stages.filter((s) => s.id >= 6).flatMap((s) => [
    { id: `${s.checkpoint.id}-reading`, task: s.checkpoint.reading },
    { id: `${s.checkpoint.id}-listening`, task: s.checkpoint.listening },
  ]),
];

describe("Stage 6–7 lessons use official IELTS question groups", () => {
  it("covers all 12 lessons and both checkpoints", () => expect(tasks).toHaveLength(16));

  it.each(tasks.map((t) => [t.id, t.task] as const))("%s is valid and gradable", (_, task) => {
    expect(task.groups?.length).toBeGreaterThan(0);
    expect(task.questions).toHaveLength(0);
    expect(checkQuestionGroups("lesson", task.groups!)).toEqual([]);
    expect(gradeGroups(task.groups!, perfect(task.groups!)).raw).toBe(taskQuestionCount(task));
    const g = gradeTask(task, perfect(task.groups!));
    expect(g.pct).toBe(1);
    expect(taskAnsweredCount(task, perfect(task.groups!))).toBe(taskQuestionCount(task));
    expect(gradeTask(task, {}).pct).toBe(0);
  });

  it("uses every official question type except labelling (which needs a map)", () => {
    const types = new Set(tasks.flatMap((t) => t.task.groups!.map((g) => g.type)));
    for (const t of ["mcq", "mcq-multi", "tfng", "ynng", "matching", "completion", "completion-box"]) expect(types).toContain(t);
  });

  it("keeps Stages 1–2 on the simple format", () => {
    for (const l of allLessons.filter((x) => x.stage <= 2 && (x.reading || x.listening))) {
      expect((l.reading ?? l.listening)!.groups).toBeUndefined();
    }
  });
});
