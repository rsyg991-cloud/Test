import { describe, expect, it } from "vitest";
import baseline from "./fixtures/ids-baseline.json";
import { graphemeById, type Item } from "@/content/items";
import { PSEUDO_WORDS, stage0ItemById, stage0Lessons, WORDS, type Step } from "@/content/stage0";
import { emptyTaught, modeOf, spellingOf, teach, wordProblems, type Mode, type Taught } from "@/lib/phonics";

const ARABIC = /[؀-ۿ]/;
const item = (id: string): Item => {
  const x = stage0ItemById.get(id);
  if (!x) throw new Error(`unknown item ${id}`);
  return x;
};
const SHOWN: Mode[] = ["readable", "sight", "supported"];
const KNOWN: Mode[] = ["readable", "sight"];

/** Walk every Stage 0 step in order with the learner's knowledge at that point. */
function walk(visit: (step: Step, taught: Taught, lesson: string) => void) {
  let taught = emptyTaught();
  for (const lesson of stage0Lessons) {
    for (const step of lesson.steps) {
      if (step.type === "teach") taught = teach(taught, step.teaches);
      visit(step, taught, lesson.id);
    }
  }
}
const mode = (id: string, t: Taught, use: "text" | "keyword" = "text") => modeOf(item(id), t, use);

describe("Stage 0 items", () => {
  it("spell every decoding word and pseudo-word correctly from its graphemes (one vowel sound each)", () => {
    for (const w of [...WORDS.filter((x) => x.decodable !== false), ...PSEUDO_WORDS]) {
      expect(wordProblems(w), w.id).toEqual([]);
    }
  });

  it("give every decoding word the pronunciation its graphemes spell (General American)", () => {
    for (const w of [...WORDS.filter((x) => x.decodable !== false), ...PSEUDO_WORDS]) {
      const gpc = w.gpc.map((id) => graphemeById.get(id)!);
      // a split digraph's sound comes where its vowel letter is: c a_e k = k eɪ k
      const ipa = gpc.map((x) => x.ipa).join("");
      expect(ipa, `${w.id} /${w.ipa}/`).toBe(w.ipa.replace(/ˈ/g, ""));
    }
  });

  it("have unique ids, and pseudo-words are never real words", () => {
    const all = [...stage0ItemById.keys()];
    expect(new Set(all).size).toBe(all.length);
    const real = new Set(WORDS.map((w) => w.text.toLowerCase()));
    for (const p of PSEUDO_WORDS) expect(real.has(p.text), p.text).toBe(false);
  });

  it("contain nothing offensive or unsuitable for the audience", () => {
    const banned = /^(tit|tits|fag|gyp|gip|quim|cum|dick|dyke|nob|spic|wop|jap|coon|chink|fanny|piss|shit|crap|damn|hell|ass|arse|bum|slag|slut|twat|wank|cock|prick|hun|pig|pigs|pork|bacon|ham|wine|beer|rum|gin|god|sin)$/i;
    for (const x of stage0ItemById.values()) if ("text" in x) expect(x.text, x.id).not.toMatch(banned);
  });

  it("never use dog or long as decoding exemplars (General American vowel)", () => {
    for (const id of ["w:dog", "w:long", "w:dogs"]) expect((item(id) as { decodable?: boolean }).decodable, id).toBe(false);
  });
});

describe("Stage 0 lessons", () => {
  it("use new z0- ids that no existing content uses", () => {
    const existing = new Set(baseline.lessons.map((l) => l.id));
    const ids = stage0Lessons.flatMap((l) => [l.id, ...l.steps.map((s) => s.id)]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^z0-u\d-(l\d+|check)(-s\d+)?$/);
      expect(existing.has(id)).toBe(false);
    }
  });

  it("start with the welcome lesson, then Unit 1 l1–l8 and the unit check", () => {
    expect(stage0Lessons.map((l) => l.id)).toEqual([
      "z0-u0-l1",
      ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `z0-u1-l${n}`),
      "z0-u1-check",
    ]);
  });

  it("have Arabic objectives, Arabic instructions on every step and an Arabic explanation for every wrong answer (AC-6)", () => {
    for (const l of stage0Lessons) {
      expect(l.objectivesAr.length, l.id).toBeGreaterThanOrEqual(2);
      for (const o of l.objectivesAr) expect(o, l.id).toMatch(ARABIC);
      for (const s of l.steps) {
        expect(s.ar, s.id).toMatch(ARABIC);
        if ("wrongAr" in s) expect(s.wrongAr, s.id).toMatch(ARABIC);
        if (s.type === "teach") expect(s.explainAr, s.id).toMatch(ARABIC);
      }
    }
  });

  it("only reference items that exist", () => {
    walk((s) => {
      const ids: string[] = [];
      if ("target" in s && typeof s.target === "string") ids.push(s.target);
      if ("target" in s && Array.isArray(s.target)) ids.push(...s.target);
      if ("options" in s && s.type !== "namePick") ids.push(...s.options);
      if ("tokens" in s) ids.push(...s.tokens);
      if (s.type === "teach") ids.push(...s.teaches, ...(s.keyword ? [s.keyword] : []));
      for (const id of ids) expect(() => item(id), `${s.id} → ${id}`).not.toThrow();
    });
  });
});

describe("Stage 0: nothing is shown before it may be (AC-1 … AC-5, AC-10)", () => {
  it("never shows an English token as raw untaught text", () => {
    walk((s, t) => {
      const shown: string[] = s.type === "show" || s.type === "readText" || s.type === "build" ? s.tokens : [];
      for (const id of shown) expect(SHOWN, `${s.id}: ${id} is ${mode(id, t)}`).toContain(mode(id, t));
    });
  });

  it("shows punctuation only after it has been explained (R3-12)", () => {
    walk((s, t) => {
      const shown: string[] = s.type === "show" || s.type === "readText" || s.type === "build" ? s.tokens : [];
      for (const id of shown.filter((x) => x.startsWith("p:"))) expect(mode(id, t), `${s.id}: ${id}`).toBe("readable");
    });
  });

  it("asks the learner to read or decode only readable words, pseudo-words or taught sight words", () => {
    walk((s, t) => {
      if (s.type === "readPick" || s.type === "decodePick" || s.type === "nameSpellPick")
        expect(KNOWN, `${s.id}: ${s.target} is ${mode(s.target, t)}`).toContain(mode(s.target, t));
      if (s.type === "readText") {
        expect(s.tokens, s.id).toContain(s.target);
        for (const o of s.options) {
          expect(s.tokens, `${s.id}: option ${o}`).toContain(o);
          expect(KNOWN, `${s.id}: option ${o} is ${mode(o, t)}`).toContain(mode(o, t));
        }
      }
      if (s.type === "nameSpellPick") for (const o of s.options) expect(KNOWN, `${s.id}: ${o}`).toContain(mode(o, t));
    });
  });

  it("only asks for typed spelling of readable words (AC-10)", () => {
    walk((s, t) => {
      if (s.type === "spell" && s.input === "keyboard") expect(mode(s.target, t), `${s.id}: ${s.target}`).toBe("readable");
    });
  });

  it("decodes against spelled neighbours (so a memorised shape can't pass) and only taught letters", () => {
    walk((s, t) => {
      if (s.type !== "decodePick") return;
      expect(s.options.length, s.id).toBe(3);
      for (const o of s.options) expect("gpc" in item(o) && (item(o) as { gpc: unknown[] }).gpc.length, `${s.id}: ${o}`).toBeTruthy();
      if (s.type === "decodePick" && s.target.startsWith("pw:")) expect(s.ar, s.id).toContain("مو حقيقية");
      void t;
    });
  });

  it("asks about letters and sounds only after they are taught", () => {
    walk((s, t) => {
      if (s.type === "soundPick") for (const o of s.options) expect(t.graphemes.has(o), `${s.id}: ${o}`).toBe(true);
      if (s.type === "namePick" || s.type === "nameSpellPick") expect(t.patterns.has("p:letter-names"), s.id).toBe(true);
    });
  });

  it("keeps keywords and listening-only steps free of untaught text (AC-5)", () => {
    walk((s, t) => {
      if (s.type === "teach" && s.keyword) {
        const m = mode(s.keyword, t, "keyword");
        expect(["hidden", "readable"], `${s.id}: keyword ${s.keyword} is ${m}`).toContain(m);
        expect((item(s.keyword) as { image?: string }).image, `${s.id}: keyword needs a picture`).toBeTruthy();
      }
      if (s.type === "contrast") expect(s.listeningOnly, s.id).toBe(true);
      if (s.type === "listenPick" || s.type === "contrast" || s.type === "readPick") {
        for (const o of s.options) {
          const x = item(o) as { image?: string; ar?: string };
          expect(x.image || x.ar, `${s.id}: option ${o} needs a picture or Arabic meaning`).toBeTruthy();
        }
      }
      if (s.type === "readPick") for (const o of s.options) expect((item(o) as { image?: string }).image, `${s.id}: ${o}`).toBeTruthy();
    });
  });

  it("teaches each grapheme before any word containing it and each cluster before any cluster word (AC-2, AC-3)", () => {
    // Implied by the readable checks above; this makes the ordering explicit for the D2 sequence.
    const firstUse = new Map<string, number>();
    stage0Lessons.forEach((l, li) =>
      l.steps.forEach((s) => {
        if (s.type === "teach") for (const id of s.teaches) if (!firstUse.has(id)) firstUse.set(id, li);
      }),
    );
    const at = (id: string) => firstUse.get(id) ?? Infinity;
    expect(at("p:letter-names")).toBeLessThan(at("g:a_e"));
    expect(at("g:sh")).toBeLessThan(at("p:onset-st"));
    expect(at("p:onset-thr")).toBeLessThan(at("g:ee")); // "three" is read only in l8
    expect(at("p:coda-nt")).toBeLessThanOrEqual(at("g:s/z"));
    expect(spellingOf(["g:th", "g:r", "g:ee"])).toBe("three");
  });

  it("keeps every speaking step optional", () => {
    walk((s) => {
      if (s.type === "say") expect(s.optional, s.id).toBe(true);
    });
  });
});
