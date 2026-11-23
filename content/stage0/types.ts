import type { GraphemeId, ItemId } from "../items";

/**
 * Word-knowledge dimensions, tracked separately per item: no dimension is credited from another.
 * AR aural recognition · WF written-form recognition · DC phonological decoding · MC-L meaning from
 * listening · MC-R meaning from reading · SP spelling recall · OR oral recall · PU productive use.
 */
export type Dimension = "AR" | "WF" | "DC" | "MC-L" | "MC-R" | "SP" | "OR" | "PU";

interface Base {
  id: string;
  /** Arabic instruction shown above the step (required for every Stage 0 step). */
  ar: string;
}

interface Scored extends Base {
  dimension: Dimension;
  /** Arabic explanation shown after a wrong answer. */
  wrongAr: string;
}

/**
 * Every English token a step displays is an item id, never raw text, so the engine can compute its
 * presentation mode for this learner at this step (tests check none is shown before it may be).
 */
export type Step =
  /** Introduce graphemes (capital + small), patterns or sight words. Text and audio: exposure only. */
  | (Base & { type: "teach"; teaches: ItemId[]; keyword?: ItemId; explainAr: string })
  /** Text with audio together (a model sentence, a chunk): exposure only. */
  | (Base & { type: "show"; tokens: ItemId[] })
  /** Hear a grapheme's sound, tap the letter. */
  | (Scored & { type: "soundPick"; dimension: "WF"; target: GraphemeId; options: GraphemeId[] })
  /** Hear a letter's NAME ("bee"), tap the letter (a–z). */
  | (Scored & { type: "namePick"; dimension: "WF"; letter: string; options: string[] })
  /** Hear a readable word spelled by letter names ("B-U-S"), tap the word. */
  | (Scored & { type: "nameSpellPick"; dimension: "WF"; target: ItemId; options: ItemId[] })
  /** Hear a word or chunk, pick its picture or Arabic meaning. No English text is shown. */
  | (Scored & { type: "listenPick"; dimension: "AR"; target: ItemId; options: ItemId[] })
  /** Listening-only minimal pair: hear one word, pick its picture/meaning. Letters are never shown. */
  | (Scored & { type: "contrast"; dimension: "AR"; listeningOnly: true; target: ItemId; options: ItemId[] })
  /** See a readable word (audio withheld until answered), pick the picture/meaning. */
  | (Scored & { type: "readPick"; dimension: "WF" | "MC-R"; target: ItemId; options: ItemId[] })
  /** See a readable or pseudo-word (audio withheld), pick the audio that matches among neighbours. */
  | (Scored & { type: "decodePick"; dimension: "DC"; target: ItemId; options: ItemId[] })
  /** Read a short text (audio withheld for readable tokens; supported tokens can be tapped to hear) and answer. */
  | (Scored & { type: "readText"; dimension: "WF" | "MC-R"; tokens: ItemId[]; target: ItemId; options: ItemId[] })
  /** Hear a word, type it (readable words) or order tiles (sight words). */
  | (Scored & { type: "spell"; dimension: "SP"; target: ItemId; input: "keyboard" | "tiles" })
  /** Order tiles into an utterance (punctuation tokens are placed automatically). Scored deterministically. */
  | (Scored & { type: "build"; dimension: "PU"; tokens: ItemId[] })
  /** Say it. Always optional: logs an attempt; speech recognition is a hint only and never scores. */
  | (Base & { type: "say"; dimension: "OR"; target: ItemId[]; optional: true; model: ItemId[] });

export interface Stage0Lesson {
  id: string;
  unit: number;
  index: number;
  title: string;
  titleAr: string;
  objectivesAr: string[];
  minutes: number;
  steps: Step[];
}
