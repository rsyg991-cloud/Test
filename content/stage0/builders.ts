/**
 * Stage 0 items index and step builders (Arabic templates), shared by every Stage 0 unit.
 */
import { GRAPHEMES, graphemeById, type GraphemeId, type Item, type ItemId } from "../items";
import { CHUNKS, CODAS, ONSETS, PATTERNS, PSEUDO_WORDS, SIGHT_WORDS, WORDS } from "./items";
import { MEANINGS } from "./meanings";
import type { Step } from "./types";

export const stage0Items: Item[] = [...GRAPHEMES, ...WORDS, ...PSEUDO_WORDS, ...SIGHT_WORDS, ...CHUNKS, ...PATTERNS, ...MEANINGS];
export const stage0ItemById = new Map<string, Item>(stage0Items.map((x) => [x.id, x]));

/** Wraps English inside Arabic text in a Unicode direction isolate, so "Nat has a cat." keeps its order. */
export const en = (s: string) => `\u2068${s}\u2069`;

export const item = (id: string) => {
  const x = stage0ItemById.get(id);
  if (!x) throw new Error(`Unknown Stage 0 item ${id}`);
  return x;
};
export const textOf = (id: string) => {
  const x = item(id);
  return "text" in x ? x.text : "spelling" in x ? x.spelling : "label" in x ? x.label : "";
};
export const arOf = (id: string) => {
  const x = item(id);
  return "ar" in x ? x.ar : "";
};
export const imageOf = (id: string) => (item(id) as { image?: string }).image;
export const gpcOf = (id: string) => (item(id) as { gpc?: GraphemeId[] }).gpc ?? [];

export const LETTER_NAMES: Record<string, { ipa: string; ar: string }> = Object.fromEntries(
  (
    [
      ["a", "eɪ", "إيه"], ["b", "biː", "بي"], ["c", "siː", "سي"], ["d", "diː", "دي"], ["e", "iː", "إي"],
      ["f", "ɛf", "إف"], ["g", "dʒiː", "جي"], ["h", "eɪtʃ", "إيتش"], ["i", "aɪ", "آي"], ["j", "dʒeɪ", "جيه"],
      ["k", "keɪ", "كيه"], ["l", "ɛl", "إل"], ["m", "ɛm", "إم"], ["n", "ɛn", "إن"], ["o", "oʊ", "أو"],
      ["p", "piː", "بي (بنفَس)"], ["q", "kjuː", "كيو"], ["r", "ɑɹ", "آر"], ["s", "ɛs", "إس"], ["t", "tiː", "تي"],
      ["u", "juː", "يو"], ["v", "viː", "في"], ["w", "ˈdʌbəljuː", "دبليو"], ["x", "ɛks", "إكس"], ["y", "waɪ", "واي"],
      ["z", "ziː", "زي"],
    ] as const
  ).map(([l, ipa, ar]) => [l, { ipa, ar }]),
);

// ---------- step builders (Arabic templates) ----------

let counter = 0;
/** Step ids are numbered per lesson: call before building each lesson. */
export const resetSteps = () => {
  counter = 0;
};
export const sid = (lesson: string) => `${lesson}-s${++counter}`;

/** Rotate through a pool deterministically, skipping excluded ids. */
export function pick<T extends string>(pool: readonly T[], exclude: readonly string[], n: number, seed: number): T[] {
  const rest = pool.filter((x) => !exclude.includes(x));
  const out: T[] = [];
  for (let i = 0; i < rest.length && out.length < n; i++) out.push(rest[(seed + i) % rest.length]);
  return out;
}

/** The n spelled items closest to the target: same length, most graphemes in the same place. */
export function neighbours(target: string, pool: readonly string[], n = 2): string[] {
  const t = gpcOf(target);
  return pool
    .filter((id) => id !== target && gpcOf(id).length === t.length && textOf(id) !== textOf(target))
    .map((id) => ({ id, same: gpcOf(id).filter((g, i) => g === t[i]).length }))
    .sort((a, b) => b.same - a.same || textOf(a.id).localeCompare(textOf(b.id)))
    .slice(0, n)
    .map((x) => x.id);
}

export const segments = (id: string) => gpcOf(id).map((g) => graphemeById.get(g)!.spelling.replace("_e", "…e")).join(" - ");

export function teach(L: string, teaches: ItemId[], explainAr: string, keyword?: ItemId): Step {
  return { id: sid(L), type: "teach", ar: "تعلّم الجديد: اسمع وشوف.", teaches, explainAr, ...(keyword ? { keyword } : {}) };
}

export function soundPick(L: string, target: GraphemeId, taught: GraphemeId[], seed: number): Step {
  const g = graphemeById.get(target)!;
  const others = pick(taught, [target, ...taught.filter((x) => graphemeById.get(x)!.ipa === g.ipa)], 2, seed);
  return {
    id: sid(L),
    type: "soundPick",
    dimension: "WF",
    ar: "اسمع الصوت واختر الحرف.",
    target,
    options: [target, ...others],
    wrongAr: `الحرف «${en(g.spelling)}» صوته /${g.ipa}/: ${g.ar}.`,
  };
}

export function decodePick(L: string, target: string, pool: string[]): Step {
  const pseudo = target.startsWith("pw:");
  return {
    id: sid(L),
    type: "decodePick",
    dimension: "DC",
    ar: pseudo
      ? "هذي كلمة مو حقيقية. اقرأها بنفسك صوت صوت، ثم اختر الصوت اللي يطابقها."
      : "اقرأ الكلمة بنفسك صوت صوت، ثم اختر الصوت اللي يطابقها.",
    target: target as ItemId,
    options: [target, ...neighbours(target, pool)] as ItemId[],
    wrongAr: `اقرأها صوت صوت: ${en(segments(target))} ← «${en(textOf(target))}»${pseudo ? " (مو كلمة حقيقية)" : ""}.`,
  };
}

export function readPick(L: string, target: string, pictured: string[], seed: number): Step {
  return {
    id: sid(L),
    type: "readPick",
    dimension: "WF",
    ar: "اقرأ الكلمة بدون صوت، واختر الصورة.",
    target: target as ItemId,
    options: [target, ...pick(pictured, [target], 2, seed)] as ItemId[],
    wrongAr: `«${en(textOf(target))}» معناها ${arOf(target)}. اقرأها صوت صوت: ${en(segments(target))}.`,
  };
}

export function spell(L: string, target: string): Step {
  return {
    id: sid(L),
    type: "spell",
    dimension: "SP",
    ar: "اسمع الكلمة واكتبها.",
    target: target as ItemId,
    input: "keyboard",
    wrongAr: `تنكتب «${en(textOf(target))}»: ${en(segments(target))}.`,
  };
}

export function contrast(L: string, a: string, b: string): Step[] {
  const one = (target: string, other: string): Step => ({
    id: sid(L),
    type: "contrast",
    dimension: "AR",
    listeningOnly: true,
    ar: "استماع فقط: اسمع واختر الصورة أو المعنى.",
    target: target as ItemId,
    options: [target, other] as ItemId[],
    wrongAr: `الفرق صوت واحد بس: «${arOf(a)}» و«${arOf(b)}». اسمعهم مرة ثانية وركّز على الصوت المختلف.`,
  });
  return [one(a, b), one(b, a)];
}

export function listenPick(L: string, target: string, pool: string[], seed: number): Step {
  return {
    id: sid(L),
    type: "listenPick",
    dimension: "AR",
    ar: "اسمع واختر المعنى.",
    target: target as ItemId,
    options: [target, ...pick(pool, [target], 2, seed)] as ItemId[],
    wrongAr: `«${en(textOf(target))}» معناها ${arOf(target)}.`,
  };
}

export function show(L: string, tokens: ItemId[], ar = "اسمع وتابع معنا."): Step {
  return { id: sid(L), type: "show", ar, tokens };
}

export function say(L: string, tokens: ItemId[]): Step {
  return {
    id: sid(L),
    type: "say",
    dimension: "OR",
    optional: true,
    ar: "قلها بصوتك (اختياري). نسمع محاولتك، لكن ما نصحح نطقك آلياً: قارن صوتك بالنموذج.",
    target: tokens,
    model: tokens,
  };
}

export const PUNCT = new Set(["p:full-stop", "p:exclamation", "p:question-mark", "p:comma"]);
/** Sentence-final punctuation: the next word starts with a capital letter. */
export const SENTENCE_END = new Set(["p:full-stop", "p:exclamation", "p:question-mark"]);

/** Should token i be capitalised (start of the text or of a new sentence)? */
export const startsSentence = (tokens: readonly string[], i: number) => i === 0 || SENTENCE_END.has(tokens[i - 1]);

export function sentence(tokens: string[]): string {
  let s = "";
  tokens.forEach((t, i) => {
    const txt = textOf(t);
    const shown = startsSentence(tokens, i) ? txt[0].toUpperCase() + txt.slice(1) : txt;
    s += PUNCT.has(t) ? shown : (s ? " " : "") + shown;
  });
  return s;
}

export function build(L: string, tokens: ItemId[]): Step {
  return {
    id: sid(L),
    type: "build",
    dimension: "PU",
    ar: "رتّب الكلمات وكوّن الجملة.",
    tokens,
    wrongAr: `الترتيب الصحيح: ${en(sentence(tokens))}`,
  };
}

