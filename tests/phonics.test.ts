import { describe, expect, it } from "vitest";
import { GRAPHEMES, type GraphemeId, type WordItem } from "@/content/items";
import { emptyTaught, evidenceAllowed, isDecodable, modeOf, requirements, spellingOf, structureOf, teach, wordProblems } from "@/lib/phonics";

const word = (text: string, gpc: string[], extra: Partial<WordItem> = {}): WordItem => ({
  kind: "word",
  id: `w:${text.toLowerCase()}`,
  text,
  gpc: gpc.map((x) => `g:${x}` as GraphemeId),
  ipa: "",
  ar: "",
  ...extra,
});

const L1 = ["g:s", "g:a", "g:t", "g:p", "g:i", "g:n"] as const;

describe("grapheme inventory", () => {
  it("has unique ids and marks vowels", () => {
    expect(new Set(GRAPHEMES.map((g) => g.id)).size).toBe(GRAPHEMES.length);
    expect(GRAPHEMES.filter((g) => g.vowel).map((g) => g.spelling)).toEqual(["a", "i", "o", "e", "u", "ee", "oo", "a_e", "i_e", "o_e"]);
  });
});

describe("spelling from graphemes", () => {
  it("joins plain graphemes and places the e of a split digraph", () => {
    expect(spellingOf(["g:sh", "g:i", "g:p"])).toBe("ship");
    expect(spellingOf(["g:c", "g:a_e", "g:k"])).toBe("cake");
    expect(spellingOf(["g:n", "g:o_e", "g:s/z"])).toBe("nose");
  });

  it("rejects unknown graphemes and a dangling split digraph", () => {
    expect(() => spellingOf(["g:zz" as GraphemeId])).toThrow();
    expect(() => spellingOf(["g:m", "g:a_e"])).toThrow();
  });

  it("flags a gpc that doesn't spell the word, and words with two vowels", () => {
    expect(wordProblems(word("sit", ["s", "a", "t"]))).toHaveLength(1);
    expect(wordProblems(word("insect", ["i", "n", "s", "e", "c", "t"]))).toContain("Stage 0 decoding words have exactly one vowel sound");
    expect(wordProblems(word("Nat", ["n", "a", "t"]))).toEqual([]);
  });
});

describe("clusters and patterns", () => {
  it("finds onset and coda clusters, treating digraphs as one consonant", () => {
    expect(structureOf(word("ant", ["a", "n", "t"]))).toMatchObject({ onset: "", coda: "nt" });
    expect(structureOf(word("three", ["th", "r", "ee"]))).toMatchObject({ onset: "thr", coda: "" });
    expect(structureOf(word("black", ["b", "l", "a", "ck"]))).toMatchObject({ onset: "bl", coda: "" });
    expect(structureOf(word("ship", ["sh", "i", "p"]))).toMatchObject({ onset: "", coda: "" });
    expect(structureOf(word("box", ["b", "o", "x"]))).toMatchObject({ onset: "", coda: "" });
  });

  it("needs the plural pattern, not a cluster, for a plural -s", () => {
    expect(requirements(word("cats", ["c", "a", "t", "s"], { plural: true })).patterns).toEqual(["p:plural-s"]);
    expect(requirements(word("pens", ["p", "e", "n", "s/z"], { plural: true })).patterns).toEqual(["p:plural-s"]);
  });
});

describe("presentation mode (computed per learner and step)", () => {
  const tap = word("tap", ["t", "a", "p"]);

  it("turns a keyword into a readable word once its last grapheme is taught", () => {
    const beforeP = teach(emptyTaught(), ["g:s", "g:a", "g:t"]);
    expect(modeOf(tap, beforeP, "keyword")).toBe("hidden");
    expect(modeOf(tap, beforeP, "text")).toBe("supported");
    expect(modeOf(tap, teach(beforeP, ["g:p"]), "keyword")).toBe("readable");
  });

  it("keeps cluster words unreadable until the cluster is taught (R3-1, R3-4)", () => {
    const t = teach(emptyTaught(), [...L1]);
    const ant = word("ant", ["a", "n", "t"]);
    expect(isDecodable(ant, t)).toBe(false);
    expect(isDecodable(ant, teach(t, ["p:coda-nt"]))).toBe(true);
  });

  it("never makes a word marked non-decodable readable (dog, long)", () => {
    const all = teach(emptyTaught(), GRAPHEMES.map((g) => g.id));
    expect(modeOf(word("dog", ["d", "o", "g"], { decodable: false }), all, "text")).toBe("supported");
  });

  it("shows a sight word as text only after it is taught", () => {
    const I = { kind: "sightWord" as const, id: "sw:I" as const, text: "I", ipa: "aɪ", ar: "أنا" };
    expect(modeOf(I, emptyTaught(), "text")).toBe("supported");
    expect(modeOf(I, teach(emptyTaught(), ["sw:I"]), "text")).toBe("sight");
  });

  it("always supports chunks", () => {
    expect(modeOf({ kind: "chunk", id: "ch:hello", text: "Hello", ar: "مرحبا" }, teach(emptyTaught(), [...L1]), "text")).toBe("supported");
  });

  it("gives credit only for readable or sight text answered before any audio (AC-7, AC-8)", () => {
    expect(evidenceAllowed("readable", false)).toBe("credit");
    expect(evidenceAllowed("readable", true)).toBe("exposure");
    expect(evidenceAllowed("sight", false)).toBe("credit");
    expect(evidenceAllowed("supported", false)).toBe("exposure");
    expect(evidenceAllowed("hidden", false)).toBe("exposure");
  });
});
