/**
 * Learning items: the smallest things Balbal teaches and reviews.
 *
 * - grapheme: a letter or letter team with one sound ("sh" = /ʃ/). Each letter is taught capital + small.
 * - word: spelled out as grapheme ids (`gpc`), so the engine can tell when a learner can decode it.
 * - sightWord: irregular, taught as a whole shape ("I", "the").
 * - chunk: a memorised expression, always shown with audio ("Hello", "I'm …", "What's your name?").
 * - pattern: a rule or frame: consonant clusters, plural -s, punctuation, sentence frames.
 *
 * Ids are permanent (review history points at them): never rename or reuse one.
 * A word's presentation mode (hidden / readable / sight / supported) is not stored here: lib/phonics
 * computes it from what the learner has been taught before each step.
 */

export type GraphemeId = `g:${string}`;
export type WordId = `w:${string}`;
export type SightWordId = `sw:${string}`;
export type ChunkId = `ch:${string}`;
export type PatternId = `p:${string}`;
export type PseudoId = `pw:${string}`;
export type MeaningId = `m:${string}`;
export type ItemId = GraphemeId | WordId | SightWordId | ChunkId | PatternId | PseudoId | MeaningId;

export interface GraphemeItem {
  kind: "grapheme";
  id: GraphemeId;
  /** Lower-case spelling. A split digraph is written "a_e". */
  spelling: string;
  /** General American sound. */
  ipa: string;
  vowel: boolean;
  /** Arabic hint for the sound, for the Arabic explanation. */
  ar: string;
}

export interface WordItem {
  kind: "word";
  id: WordId;
  /** As shown. A capital first letter is allowed (names, sentence starts). */
  text: string;
  /** The spelling as grapheme ids, in order: "ship" = g:sh g:i g:p; "cake" = g:c g:a_e g:k. */
  gpc: GraphemeId[];
  /** The final "s" is the plural ending (cats, pens): needs p:plural-s as well as its grapheme. */
  plural?: boolean;
  /** Expected General American pronunciation, checked by the human reviewer. */
  ipa: string;
  ar: string;
  /**
   * false = never a decoding exemplar, always shown with audio ("dog", "long": the General American
   * vowel is not the taught short o). Default true.
   */
  decodable?: boolean;
  image?: string;
}

/**
 * A made-up but decodable word ("tas", "fip"). Reading one proves decoding, not memory.
 * Always labelled "مو كلمة حقيقية" (not a real word). Hand-picked, never generated, so none can be
 * a real or offensive word.
 */
export interface PseudoWordItem {
  kind: "pseudo";
  id: PseudoId;
  text: string;
  gpc: GraphemeId[];
  plural?: undefined;
  ipa: string;
}

export interface SightWordItem {
  kind: "sightWord";
  id: SightWordId;
  text: string;
  ipa: string;
  ar: string;
}

export interface ChunkItem {
  kind: "chunk";
  id: ChunkId;
  text: string;
  ar: string;
}

export interface PatternItem {
  kind: "pattern";
  id: PatternId;
  label: string;
  ar: string;
}

/** An answer choice that is a meaning, not English: an Arabic sentence and/or a picture. Never shows English text. */
export interface MeaningItem {
  kind: "meaning";
  id: MeaningId;
  ar: string;
  image?: string;
}

export type Item = GraphemeItem | WordItem | PseudoWordItem | SightWordItem | ChunkItem | PatternItem | MeaningItem;

const g = (spelling: string, ipa: string, ar: string, vowel = false): GraphemeItem => ({
  kind: "grapheme",
  id: `g:${spelling}`,
  spelling: spelling.replace(/\/.*$/, ""),
  ipa,
  vowel,
  ar,
});

/** Stage 0 graphemes (General American). "s/z" and "th/ð" are second sounds of the same spelling. */
export const GRAPHEMES: GraphemeItem[] = [
  // l1
  g("s", "s", "س"),
  g("a", "æ", "فتحة ممدودة قليلاً، بين 'آ' و'إي'", true),
  g("t", "t", "ت"),
  g("p", "p", "مثل ب لكن بدون صوت من الحنجرة، مع نفَس"),
  g("i", "ɪ", "كسرة قصيرة", true),
  g("n", "n", "ن"),
  // l2
  g("m", "m", "م"),
  g("d", "d", "د"),
  g("g", "ɡ", "مثل الجيم المصرية"),
  g("o", "ɑ", "مثل 'آ' مفتوحة من آخر الفم", true),
  g("c", "k", "ك"),
  g("k", "k", "ك"),
  // l3
  g("e", "ɛ", "مثل 'إيه' قصيرة", true),
  g("u", "ʌ", "مثل 'أَ' قصيرة من وسط الفم", true),
  g("r", "ɹ", "راء بدون ترديد، اللسان ما يلمس سقف الفم"),
  g("h", "h", "هـ"),
  g("b", "b", "ب"),
  g("f", "f", "ف"),
  // l4
  g("l", "l", "ل"),
  g("j", "dʒ", "ج"),
  g("v", "v", "مثل ف لكن مع صوت من الحنجرة"),
  g("w", "w", "و"),
  g("y", "j", "ي"),
  g("z", "z", "ز"),
  g("x", "ks", "كس"),
  g("qu", "kw", "كو"),
  // l6
  g("sh", "ʃ", "ش"),
  g("ch", "tʃ", "تش"),
  g("th", "θ", "ث"),
  g("th/ð", "ð", "ذ"),
  g("ck", "k", "ك"),
  g("ng", "ŋ", "نغ من الأنف بدون غ واضحة"),
  g("nk", "ŋk", "نك من الأنف"),
  // l8
  g("ee", "iː", "إي طويلة", true),
  g("oo", "uː", "أو طويلة", true),
  g("a_e", "eɪ", "إيه طويلة مثل اسم الحرف A", true),
  g("i_e", "aɪ", "آي مثل اسم الحرف I", true),
  g("o_e", "oʊ", "أو مثل اسم الحرف O", true),
  g("s/z", "z", "ز"),
];

export const graphemeById = new Map(GRAPHEMES.map((x) => [x.id, x]));
