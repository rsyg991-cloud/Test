/**
 * Decodability engine. Whether a word is readable is a property of the word AND the learner's
 * knowledge at that step, so it is computed, never stored:
 *
 *   hidden     – not decodable yet, used as a sound keyword: image + audio only, no text
 *   readable   – every grapheme and pattern taught: text, no audio before the learner answers
 *   sight      – an irregular word taught as a whole shape: text
 *   supported  – shown for meaning but not decodable (a chunk, listen-first vocabulary):
 *                text, always with audio and an Arabic gloss
 *
 * The change is one-way: as soon as the last missing grapheme or pattern is taught, the word is
 * readable from the next step on.
 */
import { graphemeById, type GraphemeId, type Item, type ItemId, type PatternId, type WordItem } from "@/content/items";

export type Mode = "hidden" | "readable" | "sight" | "supported";
export type Use = "keyword" | "text";

export interface Taught {
  graphemes: Set<GraphemeId>;
  patterns: Set<PatternId>;
  sightWords: Set<ItemId>;
}

export const emptyTaught = (): Taught => ({ graphemes: new Set(), patterns: new Set(), sightWords: new Set() });

/** Add what a step teaches (grapheme, pattern and sight-word ids; other ids are ignored). */
export function teach(taught: Taught, ids: readonly ItemId[]): Taught {
  const next: Taught = {
    graphemes: new Set(taught.graphemes),
    patterns: new Set(taught.patterns),
    sightWords: new Set(taught.sightWords),
  };
  for (const id of ids) {
    if (id.startsWith("g:")) next.graphemes.add(id as GraphemeId);
    else if (id.startsWith("p:")) next.patterns.add(id as PatternId);
    else if (id.startsWith("sw:")) next.sightWords.add(id);
  }
  return next;
}

/** Rebuild the spelling from grapheme ids. A split digraph ("a_e") puts its "e" after the next grapheme. */
export function spellingOf(gpc: readonly GraphemeId[]): string {
  let out = "";
  let pendingE = false;
  for (const id of gpc) {
    const gr = graphemeById.get(id);
    if (!gr) throw new Error(`Unknown grapheme ${id}`);
    if (gr.spelling.includes("_")) {
      if (pendingE) throw new Error(`Two split digraphs in a row: ${gpc.join(" ")}`);
      out += gr.spelling.split("_")[0];
      pendingE = true;
      continue;
    }
    out += gr.spelling;
    if (pendingE) {
      out += "e";
      pendingE = false;
    }
  }
  if (pendingE) throw new Error(`Split digraph with nothing after it: ${gpc.join(" ")}`);
  return out;
}

export interface Structure {
  vowels: number;
  onset: string;
  coda: string;
}

/** Syllable shape of a one-syllable word: its onset and coda consonant spellings. */
export function structureOf(word: { gpc: readonly GraphemeId[]; plural?: boolean }): Structure {
  const gpc = word.plural ? word.gpc.slice(0, -1) : word.gpc;
  const isVowel = gpc.map((id) => graphemeById.get(id)!.vowel);
  const vowels = isVowel.filter(Boolean).length;
  const first = isVowel.indexOf(true);
  const last = isVowel.lastIndexOf(true);
  const sp = (ids: readonly GraphemeId[]) => ids.map((id) => graphemeById.get(id)!.spelling).join("");
  return {
    vowels,
    onset: first < 0 ? "" : first >= 2 ? sp(gpc.slice(0, first)) : "",
    coda: last < 0 ? "" : gpc.length - last - 1 >= 2 ? sp(gpc.slice(last + 1)) : "",
  };
}

/** Anything spelled out in graphemes: a real word or a pseudo-word. */
type Spelled = Pick<WordItem, "text" | "gpc" | "plural"> & { decodable?: boolean };

/** Everything a learner must have been taught to decode this word. */
export function requirements(word: Spelled): { graphemes: GraphemeId[]; patterns: PatternId[] } {
  const s = structureOf(word);
  const patterns: PatternId[] = [];
  if (s.onset) patterns.push(`p:onset-${s.onset}`);
  if (s.coda) patterns.push(`p:coda-${s.coda}`);
  if (word.plural) patterns.push("p:plural-s");
  return { graphemes: [...new Set(word.gpc)], patterns };
}

/** Problems that make a word unusable as a decoding exemplar (empty = fine). */
export function wordProblems(word: Spelled): string[] {
  const problems: string[] = [];
  let spelled: string;
  try {
    spelled = spellingOf(word.gpc);
  } catch (e) {
    return [(e as Error).message];
  }
  if (spelled !== word.text.toLowerCase()) problems.push(`gpc spells "${spelled}", not "${word.text}"`);
  if (structureOf(word).vowels !== 1) problems.push("Stage 0 decoding words have exactly one vowel sound");
  return problems;
}

export function isDecodable(word: Spelled, taught: Taught): boolean {
  if (word.decodable === false || wordProblems(word).length) return false;
  const req = requirements(word);
  return req.graphemes.every((id) => taught.graphemes.has(id)) && req.patterns.every((id) => taught.patterns.has(id));
}

export function modeOf(item: Item, taught: Taught, use: Use): Mode {
  switch (item.kind) {
    case "word":
      if (isDecodable(item, taught)) return "readable";
      return use === "keyword" ? "hidden" : "supported";
    case "pseudo":
      // Never shown before it can be decoded: a pseudo-word has no meaning to support it.
      return isDecodable(item, taught) ? "readable" : "hidden";
    case "sightWord":
      if (taught.sightWords.has(item.id)) return "sight";
      return use === "keyword" ? "hidden" : "supported";
    case "pattern":
      // Punctuation and frames: known once taught, otherwise explained where they appear.
      if (taught.patterns.has(item.id)) return "readable";
      return use === "keyword" ? "hidden" : "supported";
    case "chunk":
      return use === "keyword" ? "hidden" : "supported";
    case "grapheme":
      return taught.graphemes.has(item.id) ? "readable" : "hidden";
  }
}

/** What a step that displays text may earn as evidence: text + audio together is exposure only. */
export function evidenceAllowed(mode: Mode, audioPlayedBeforeAnswer: boolean): "exposure" | "credit" {
  if (mode === "hidden" || mode === "supported") return "exposure";
  return audioPlayedBeforeAnswer ? "exposure" : "credit";
}
