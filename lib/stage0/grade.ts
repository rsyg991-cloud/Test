/**
 * Server-side grading of a Stage 0 lesson. The browser sends what the learner chose; correctness,
 * presentation modes and evidence are worked out here, never trusted from the client.
 */
import { stage0ItemById, type Stage0Lesson, type Step } from "@/content/stage0";
import { evidenceFor, type Evidence } from "@/lib/learning/evidence";
import { stage0Exit, type GateDecision, type Stage0Results } from "@/lib/learning/gates";
import { lessonView } from "./view";

export interface StepAnswer {
  stepId: string;
  /** Picked option id (or letter for namePick). */
  choice?: string;
  /** Typed spelling. */
  typed?: string;
  /** Tile order for build steps (item ids, punctuation left out). */
  order?: string[];
  /** Did the learner hear the target before answering? (only possible where the player allows it) */
  audioBeforeAnswer?: boolean;
  /** Correct only on the second try. */
  hinted?: boolean;
  /** Spoken steps: the learner's own comparison with the model. */
  selfMark?: boolean;
  /** The learner recorded themselves (spoken steps). */
  recorded?: boolean;
  skipped?: boolean;
}

export interface StepResult {
  stepId: string;
  type: Step["type"];
  scored: boolean;
  correct: boolean;
  evidence: Evidence | null;
}

export interface LessonGrade {
  results: StepResult[];
  evidence: Evidence[];
  correct: number;
  total: number;
  pct: number;
  /** Spoken steps the learner tried (recorded or self-marked) out of all spoken steps. */
  speakingAttempts: { tried: number; total: number };
  gate?: GateDecision & { results: Stage0Results };
}

const textOf = (id: string) => {
  const x = stage0ItemById.get(id);
  return x && "text" in x ? x.text : "";
};
const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ").replace(/[.!?]+$/, "");

export function isCorrect(step: Step, a: StepAnswer | undefined): boolean {
  if (!a || a.skipped) return false;
  switch (step.type) {
    case "namePick":
      return a.choice === step.letter;
    case "spell":
      return norm(a.typed ?? "") === norm(textOf(step.target));
    case "build": {
      const want = step.tokens.filter((t) => !t.startsWith("p:"));
      return !!a.order && a.order.length === want.length && a.order.every((t, i) => t === want[i]);
    }
    case "say":
    case "teach":
    case "show":
      return false;
    default:
      return a.choice === step.target;
  }
}

const SCORED = new Set<Step["type"]>(["soundPick", "namePick", "nameSpellPick", "listenPick", "contrast", "readPick", "decodePick", "readText", "spell", "build"]);

export function gradeStage0Lesson(
  lesson: Stage0Lesson,
  answers: StepAnswer[],
  opts: {
    /** Item ids the learner saw in their previous 3 sessions (decoding of these counts as recognition). */
    recentlySeen?: Set<string>;
    /** Unit check only: share of the unit's spoken steps the learner tried in earlier lessons. */
    speakingShare?: number;
  } = {},
): LessonGrade {
  const byStep = new Map(answers.map((a) => [a.stepId, a]));
  const views = lessonView(lesson);
  const results: StepResult[] = views.map(({ step, items }) => {
    const a = byStep.get(step.id);
    const scored = SCORED.has(step.type);
    const correct = scored && isCorrect(step, a);
    const targetId = "target" in step && typeof step.target === "string" ? step.target : undefined;
    const mode = targetId ? items[targetId]?.mode ?? "supported" : "readable";
    // Decoding shows the word and lets the learner play the three candidate sounds: that is the task,
    // not a hint, so the target's own audio counts as withheld.
    const audioBeforeAnswer = step.type === "decodePick" ? false : !!a?.audioBeforeAnswer;
    const evidence =
      a && !a.skipped
        ? evidenceFor({
            step,
            mode,
            audioBeforeAnswer,
            correct,
            hinted: a.hinted,
            selfMark: a.selfMark,
            seenRecently: targetId ? opts.recentlySeen?.has(targetId) : false,
          })
        : null;
    return { stepId: step.id, type: step.type, scored, correct, evidence };
  });
  const scored = results.filter((r) => r.scored);
  const correct = scored.filter((r) => r.correct).length;
  const say = lesson.steps.filter((s) => s.type === "say");
  const tried = say.filter((s) => {
    const a = byStep.get(s.id);
    return a && !a.skipped && (a.recorded || a.selfMark !== undefined);
  }).length;
  const grade: LessonGrade = {
    results,
    evidence: results.map((r) => r.evidence).filter((e): e is Evidence => !!e),
    correct,
    total: scored.length,
    pct: scored.length ? correct / scored.length : 1,
    speakingAttempts: { tried, total: say.length },
  };
  if (lesson.id.endsWith("-check")) grade.gate = unitGate(lesson, results, opts.speakingShare);
  return grade;
}

/** Accuracy over the steps of some types (1 when there are none). */
function accuracy(lesson: Stage0Lesson, results: StepResult[], pred: (s: Step) => boolean): number {
  const steps = new Map(lesson.steps.map((s) => [s.id, s]));
  const rs = results.filter((r) => r.scored && pred(steps.get(r.stepId)!));
  return rs.length ? rs.filter((r) => r.correct).length / rs.length : 1;
}

function unitGate(lesson: Stage0Lesson, results: StepResult[], speakingShare = 1): GateDecision & { results: Stage0Results } {
  const r: Stage0Results = {
    AR: accuracy(lesson, results, (s) => s.type === "contrast" || s.type === "listenPick"),
    WFletters: accuracy(lesson, results, (s) => s.type === "soundPick" || s.type === "namePick"),
    DC: accuracy(lesson, results, (s) => s.type === "decodePick"),
    // Unit 1 has no connected text yet: reading for meaning is measured on words (readPick).
    MCR: accuracy(lesson, results, (s) => s.type === "readPick" || s.type === "readText"),
    SP: accuracy(lesson, results, (s) => s.type === "spell"),
    PU: accuracy(lesson, results, (s) => s.type === "build"),
    speakingAttempts: speakingShare,
  };
  return { ...stage0Exit(r), results: r };
}
