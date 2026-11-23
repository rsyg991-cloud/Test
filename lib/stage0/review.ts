/**
 * Daily review for Stage 0, driven by the spaced-review engine (lib/learning/review.ts).
 *
 * Every Stage 0 Attempt stores the evidence its answers produced, per (item, dimension). Replaying
 * that evidence in order rebuilds each pair's review state, so no new table is needed. A session
 * asks again only steps from lessons the learner has completed (no generated content), shown with
 * exactly what the learner has been taught, and graded on the server against the same steps.
 */
import { stage0ItemById, stage0Lessons, type Stage0Lesson, type Step } from "@/content/stage0";
import type { Dimension } from "@/content/stage0/types";
import { targetOf, type Evidence } from "@/lib/learning/evidence";
import { applyCredit, buildSession, needsReteach, newPair, type PairState } from "@/lib/learning/review";
import { modeOf } from "@/lib/phonics";
import { readFeedback } from "./feedback";
import { taughtThrough, type Taught } from "./view";

export const REVIEW_ID = "z0-review";

/** Review questions a day: enough to hold on to what was learned, short enough to do every day. */
export const DAILY_REVIEWS = 15;

/** Review questions still open today, after the review sessions already done today (UTC day). */
export function reviewsLeftToday(attempts: { createdAt: Date; refId: string; responseJson: string }[], now: Date): number {
  const day = now.toISOString().slice(0, 10);
  let asked = 0;
  for (const a of attempts) {
    if (a.refId !== REVIEW_ID || a.createdAt.toISOString().slice(0, 10) !== day) continue;
    try {
      const v = JSON.parse(a.responseJson);
      asked += Array.isArray(v) ? v.length : 0;
    } catch {}
  }
  return Math.max(0, DAILY_REVIEWS - asked);
}

/** Steps worth asking again: scored, about one item, and not the unit checks' exit decision. */
const REVIEWABLE = new Set<Step["type"]>(["soundPick", "namePick", "nameSpellPick", "listenPick", "contrast", "readPick", "decodePick", "readText", "readSentence", "spell", "build"]);

const key = (itemId: string, d: Dimension) => `${itemId}|${d}`;

/** Rebuilds the review state of every (item, dimension) pair from the learner's Stage 0 attempts. */
export function pairsFromAttempts(attempts: { createdAt: Date; feedbackJson: string | null }[]): PairState[] {
  const pairs = new Map<string, PairState>();
  for (const a of [...attempts].sort((x, y) => x.createdAt.getTime() - y.createdAt.getTime())) {
    // One session moves each pair once, with its average credit in that session.
    const credits = new Map<string, { itemId: string; dimension: Dimension; sum: number; n: number }>();
    for (const e of readFeedback(a.feedbackJson).evidence as Evidence[]) {
      if (e.kind !== "credit") continue;
      const k = key(e.itemId, e.dimension);
      const c = credits.get(k) ?? { itemId: e.itemId, dimension: e.dimension, sum: 0, n: 0 };
      c.sum += e.credit;
      c.n += 1;
      credits.set(k, c);
    }
    for (const [k, c] of credits) {
      const mean = c.sum / c.n;
      const credit = mean >= 0.75 ? 1 : mean >= 0.25 ? 0.5 : 0;
      pairs.set(k, applyCredit(pairs.get(k) ?? newPair(c.itemId, c.dimension, a.createdAt), credit, a.createdAt));
    }
  }
  return [...pairs.values()];
}

/** The dimension a step's answer is evidence for (the step's own). */
const dimensionOf = (s: Step): Dimension | undefined => ("dimension" in s ? s.dimension : undefined);

/** Reviewable steps of the completed lessons, by (item, dimension); later lessons first. */
function stepsByPair(done: ReadonlySet<string>): Map<string, Step[]> {
  const out = new Map<string, Step[]>();
  for (const l of [...stage0Lessons].reverse()) {
    if (!done.has(l.id)) continue;
    for (const s of l.steps) {
      if (!REVIEWABLE.has(s.type)) continue;
      const item = targetOf(s);
      const d = dimensionOf(s);
      if (!item || !d) continue;
      out.set(key(item, d), [...(out.get(key(item, d)) ?? []), s]);
    }
  }
  return out;
}

/** Every reviewable step of the completed lessons, by id (to check what the browser sends back). */
export function reviewableStep(id: string, done: ReadonlySet<string>): Step | undefined {
  for (const l of stage0Lessons) {
    if (!done.has(l.id)) continue;
    const s = l.steps.find((x) => x.id === id);
    if (s && REVIEWABLE.has(s.type)) return s;
  }
  return undefined;
}

export interface ReviewPlan {
  lesson: Stage0Lesson;
  taught: Taught;
  /** Pairs due now (before the session cap). */
  due: number;
  /** Pairs missed four or more times: worth going back to the lesson that taught them. */
  reteach: string[];
  /** When the next pair comes due, if nothing is due now. */
  nextDue: Date | null;
}

/** Today's review: the due pairs the engine picks, each asked with one of the steps that taught it. */
export function planReview(pairs: PairState[], done: ReadonlySet<string>, now: Date, max = DAILY_REVIEWS): ReviewPlan {
  const taught = taughtThrough(done);
  const readable = (itemId: string) => {
    const x = stage0ItemById.get(itemId);
    if (!x) return itemId.startsWith("letter:");
    const m = modeOf(x, taught, "text");
    return m === "readable" || m === "sight";
  };
  const index = stepsByPair(done);
  // Only pairs we can ask again with a step from a completed lesson.
  const askable = pairs.filter((p) => index.has(key(p.itemId, p.dimension)));
  const session = max > 0 ? buildSession(askable, { now, maxReviews: max, maxNew: 0, readable }) : [];
  const day = Math.floor(now.getTime() / 86_400_000);
  const steps: Step[] = [];
  const used = new Set<string>();
  session.forEach((p, i) => {
    const options = index.get(key(p.itemId, p.dimension))!;
    // Vary the step from day to day when an item was taught with several.
    const s = options[(day + i) % options.length];
    if (!used.has(s.id)) {
      used.add(s.id);
      steps.push(s);
    }
  });
  const future = askable.filter((p) => p.due > now).map((p) => p.due.getTime());
  return {
    lesson: {
      id: REVIEW_ID,
      unit: 0,
      index: 0,
      title: "Review",
      titleAr: "مراجعة اليوم",
      objectivesAr: ["أثبّت اللي تعلّمته قبل ما أنساه."],
      minutes: Math.max(3, Math.round(steps.length / 2)),
      steps,
    },
    taught,
    due: askable.filter((p) => p.due <= now).length,
    reteach: [...new Set(pairs.filter(needsReteach).map((p) => p.itemId))],
    nextDue: steps.length > 0 ? null : max <= 0 ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)) : future.length ? new Date(Math.min(...future)) : null,
  };
}
