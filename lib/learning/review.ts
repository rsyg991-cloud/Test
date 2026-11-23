/**
 * Spaced review per (item, dimension), on top of the existing SM-2 in lib/srs.ts (unchanged).
 *
 * Grades come from performance, never from a self-rating button:
 *   credit 1 (first try) → 4 · credit 0.5 (after a hint, or a self-marked spoken answer) → 3 · 0 → 0.
 * A lapse resets only that dimension. Four or more lapses mark the pair for re-teaching.
 */
import type { Dimension } from "@/content/stage0/types";
import { review, type CardState } from "@/lib/srs";

export interface PairState extends CardState {
  itemId: string;
  dimension: Dimension;
  /** Recent accuracy, 0–1 (exponential moving average of credits). */
  strength: number;
  lapses: number;
  due: Date;
}

export const gradeFor = (credit: number): 0 | 3 | 4 => (credit >= 1 ? 4 : credit > 0 ? 3 : 0);

const DAY = 24 * 60 * 60 * 1000;

export function newPair(itemId: string, dimension: Dimension, now: Date): PairState {
  return { itemId, dimension, ease: 2.5, interval: 0, reps: 0, strength: 0, lapses: 0, due: now };
}

export function applyCredit(state: PairState, credit: number, now: Date): PairState {
  const next = review(state, gradeFor(credit));
  return {
    ...state,
    ...next,
    strength: Math.round((0.6 * state.strength + 0.4 * credit) * 1000) / 1000,
    lapses: state.lapses + (credit === 0 ? 1 : 0),
    due: new Date(now.getTime() + next.interval * DAY),
  };
}

export const needsReteach = (s: PairState) => s.lapses >= 4;

/** A dimension is practised only once the abilities it builds on are there. */
export function eligible(dimension: Dimension, strengthOf: (d: Dimension) => number, readable: boolean): boolean {
  switch (dimension) {
    case "DC":
    case "WF":
    case "MC-R":
      return readable;
    case "SP":
      return readable && strengthOf("DC") >= 0.6;
    case "OR":
      return strengthOf("AR") >= 0.6;
    case "PU":
      return strengthOf("OR") >= 0.6 || strengthOf("SP") >= 0.6;
    default:
      return true;
  }
}

const PRODUCTIVE: Dimension[] = ["SP", "OR", "PU", "DC"];
const ORDER: Dimension[] = ["AR", "WF", "DC", "MC-L", "MC-R", "SP", "OR", "PU"];

export interface SessionOptions {
  now: Date;
  maxReviews?: number;
  maxNew?: number;
  /** Is this item readable for the learner now? */
  readable: (itemId: string) => boolean;
  /** Items the learner has been introduced to but has no pairs for yet. */
  newItems?: { itemId: string; dimension: Dimension }[];
}

/**
 * One review session: due pairs at each item's weakest eligible dimension, at least half from
 * recall and use (spelling, saying, using, decoding), items interleaved, capped per day.
 */
export function buildSession(pairs: PairState[], o: SessionOptions): PairState[] {
  const maxReviews = o.maxReviews ?? 25;
  const maxNew = o.maxNew ?? 8;
  const byItem = new Map<string, PairState[]>();
  for (const p of pairs) byItem.set(p.itemId, [...(byItem.get(p.itemId) ?? []), p]);

  const chosen: PairState[] = [];
  for (const [itemId, list] of byItem) {
    const strengthOf = (d: Dimension) => list.find((p) => p.dimension === d)?.strength ?? 0;
    const due = list
      .filter((p) => p.due <= o.now && eligible(p.dimension, strengthOf, o.readable(itemId)))
      .sort((a, b) => a.strength - b.strength || ORDER.indexOf(a.dimension) - ORDER.indexOf(b.dimension));
    if (due[0]) chosen.push(due[0]);
  }
  chosen.sort((a, b) => a.due.getTime() - b.due.getTime());

  // Keep at least half the session productive when there is enough productive work due.
  const productive = chosen.filter((p) => PRODUCTIVE.includes(p.dimension));
  const receptive = chosen.filter((p) => !PRODUCTIVE.includes(p.dimension));
  const half = Math.ceil(maxReviews / 2);
  const take = [...productive.slice(0, Math.max(half, maxReviews - receptive.length)), ...receptive].slice(0, maxReviews);
  const reviews = interleave(take);

  const fresh = (o.newItems ?? []).slice(0, maxNew).map((n) => newPair(n.itemId, n.dimension, o.now));
  return [...reviews, ...fresh];
}

/** Alternate dimensions so two of the same kind rarely come back to back. */
function interleave(list: PairState[]): PairState[] {
  const groups = new Map<Dimension, PairState[]>();
  for (const p of list) groups.set(p.dimension, [...(groups.get(p.dimension) ?? []), p]);
  const out: PairState[] = [];
  while (out.length < list.length) {
    for (const d of ORDER) {
      const g = groups.get(d);
      if (g?.length) out.push(g.shift()!);
    }
  }
  return out;
}
