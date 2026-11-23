/**
 * Writes tests/fixtures/ids-baseline.json: every id that learners' saved progress can point to,
 * and every learner path as it was before the curriculum redesign. tests/ids-baseline.test.ts
 * checks that no later change removes an id or changes an existing learner's path.
 *
 * Run once (already done): npx tsx scripts/make-ids-baseline.ts — never regenerate it to make a test pass.
 */
import { writeFileSync } from "node:fs";
import { conversations, curriculumFrom, endStageFor, practicePrompts, stages, TARGET_BANDS } from "../content";
import { builtInTests } from "../content/mock";

const stageIds = stages.map((s) => s.id);
const baseline = {
  stages: stages.map((s) => ({ id: s.id, slug: s.slug, checkpoint: s.checkpoint.id })),
  lessons: stages.flatMap((s) => s.units.flatMap((u) => u.lessons.map((l) => ({ id: l.id, stage: l.stage, skill: l.skill })))),
  conversations: conversations.map((c) => ({ id: c.id, stage: c.stage })),
  practice: practicePrompts.map((p) => ({ id: p.id, stage: p.stage })),
  mockTests: builtInTests.map((t) => t.id),
  endStageFor: Object.fromEntries([null, ...TARGET_BANDS].map((b) => [String(b), endStageFor(b)])),
  paths: Object.fromEntries(
    stageIds.flatMap((start) => stageIds.map((end) => [`${start}-${end}`, curriculumFrom(start, end).map((i) => i.id)])),
  ),
};
writeFileSync("tests/fixtures/ids-baseline.json", JSON.stringify(baseline, null, 1) + "\n");
console.log(`lessons ${baseline.lessons.length}, conversations ${baseline.conversations.length}, practice ${baseline.practice.length}, paths ${Object.keys(baseline.paths).length}`);
