/**
 * A light summary of the seven stages, safe to import in client components
 * (the full curriculum stays on the server). tests/content.test.ts checks it matches /content.
 */
export interface StageSummary {
  id: number;
  name: string;
  camp: string;
  cefr: string;
  bandFrom: number;
  bandTo: number;
  foundation: boolean;
  /** Lessons + checkpoint. */
  items: number;
}

export const STAGE_LIST: StageSummary[] = [
  { id: 1, name: "First Words", camp: "Trailhead", cefr: "A0 → A1", bandFrom: 1, bandTo: 3, foundation: true, items: 13 },
  { id: 2, name: "Everyday English", camp: "Foothills", cefr: "A1 → A2", bandFrom: 3, bandTo: 4, foundation: true, items: 13 },
  { id: 3, name: "Confident Communication", camp: "Approach", cefr: "A2 → B1", bandFrom: 4, bandTo: 5, foundation: true, items: 13 },
  { id: 4, name: "Intermediate", camp: "Base Camp", cefr: "B1 → B1+", bandFrom: 4.5, bandTo: 5.5, foundation: false, items: 13 },
  { id: 5, name: "Upper Intermediate", camp: "The Ridge", cefr: "B1+ → B2", bandFrom: 5.5, bandTo: 6.5, foundation: false, items: 13 },
  { id: 6, name: "Advanced", camp: "High Camp", cefr: "B2 → C1", bandFrom: 6.5, bandTo: 7.5, foundation: false, items: 13 },
  { id: 7, name: "Mastery", camp: "The Summit", cefr: "C1", bandFrom: 7, bandTo: 8.5, foundation: false, items: 13 },
];

export const FINAL_STAGE = STAGE_LIST[STAGE_LIST.length - 1].id;

/** Target bands a learner can choose. */
export const TARGET_BANDS = [4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5];

/**
 * The stage a learner needs to finish to reach their target band: the first stage whose
 * exit band reaches the target. Any IELTS score (Band 5+) needs at least one full IELTS stage,
 * and Band 7.5+ targets run to the end (Mastery).
 */
export function endStageFor(targetBand: number | null | undefined): number {
  if (targetBand == null || targetBand >= 7.5) return FINAL_STAGE;
  const byBand = STAGE_LIST.find((s) => s.bandTo >= targetBand)?.id ?? FINAL_STAGE;
  const firstIelts = STAGE_LIST.find((s) => !s.foundation)?.id ?? 1;
  return targetBand >= 5 ? Math.max(byBand, firstIelts) : byBand;
}

/** Where a learner with this overall band should start. */
export function stageForBand(overall: number): number {
  if (overall < 3) return 1;
  if (overall < 4) return 2;
  if (overall < 4.5) return 3;
  if (overall < 5.5) return 4;
  if (overall < 6.5) return 5;
  if (overall < 7.5) return 6;
  return 7;
}

/** Number of path items (lessons + checkpoints) from the start stage to the end stage. */
export function pathItemCount(startStage: number, endStage: number): number {
  return STAGE_LIST.filter((s) => s.id >= startStage && s.id <= Math.max(startStage, endStage)).reduce((n, s) => n + s.items, 0);
}

/** Self-assessment for learners who skip the placement test. */
export const SELF_LEVELS = [
  { id: "a0", label: "None, or almost none", detail: "I'm starting from zero.", ar: "لا أعرف شيئاً تقريباً", stage: 1, band: 1.5 },
  { id: "a1", label: "A few words and phrases", detail: "I can say hello and introduce myself.", ar: "أعرف كلمات وعبارات بسيطة", stage: 2, band: 2.5 },
  { id: "a2", label: "Simple everyday English", detail: "I can talk about my day and shop, slowly.", ar: "أتكلم عن الأمور اليومية ببساطة", stage: 3, band: 3.5 },
  { id: "b1", label: "Quite well", detail: "I can follow conversations and read articles.", ar: "أفهم وأتكلم بشكل جيد", stage: null, band: null },
] as const;
