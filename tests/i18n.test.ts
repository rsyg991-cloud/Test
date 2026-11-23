import { describe, expect, it } from "vitest";
import { dirOf, localeFromAcceptLanguage } from "@/lib/i18n/config";
import { createTranslator, interpolate, type Plural } from "@/lib/i18n/core";
import { ar } from "@/lib/i18n/messages/ar";
import { en } from "@/lib/i18n/messages/en";

type Tree = { [k: string]: string | Plural | Tree };
const isPlural = (v: unknown): v is Plural => !!v && typeof v === "object" && "other" in v && "one" in v;

/** Flatten to "a.b.c" → value (plural objects stay whole). */
function flatten(tree: Tree, prefix = ""): Map<string, string | Plural> {
  const out = new Map<string, string | Plural>();
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string" || isPlural(v)) out.set(key, v);
    else for (const [kk, vv] of flatten(v, key)) out.set(kk, vv);
  }
  return out;
}

const EN = flatten(en as unknown as Tree);
const AR = flatten(ar as unknown as Tree);
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const tags = (s: string) => [...s.matchAll(/<(\w+)>/g)].map((m) => m[1]).sort();
const texts = (v: string | Plural) => (typeof v === "string" ? [v] : Object.values(v).filter((x): x is string => typeof x === "string"));

/** Values that are fine without Arabic letters: brand terms, IELTS labels, numbers-only patterns. */
const LATIN_OK = new Set([
  "common.band",
  "common.xp",
  "lang.switchTo",
  "lang.switchLabel",
  "landing.groupIelts",
  "landing.bandRange",
  "feedback.band",
  "celebration.band",
  "celebration.xp",
  "practice.part",
  "speaking.youShouldSay",
  "mock.writingDetail",
  "mock.correct40",
  "chart.point",
  "plans.1.gain",
  "plans.3.gain",
  "plans.6.gain",
  "onboarding.skillBandLabel",
  "plan.title",
]);

describe("interface messages", () => {
  it("Arabic has exactly the same keys as English", () => {
    expect([...AR.keys()].sort()).toEqual([...EN.keys()].sort());
  });

  it("has no empty messages", () => {
    for (const [k, v] of [...EN, ...AR]) for (const s of texts(v)) expect(s.trim(), k).not.toBe("");
  });

  it("writes the Arabic interface in Arabic", () => {
    for (const [k, v] of AR) {
      if (LATIN_OK.has(k)) continue;
      for (const s of texts(v)) expect(s, k).toMatch(/[؀-ۿ]/);
    }
  });

  it("keeps the same placeholders and tags in both languages", () => {
    for (const [k, v] of EN) {
      const a = AR.get(k)!;
      const enPh = new Set(texts(v).flatMap(placeholders));
      const arPh = new Set(texts(a).flatMap(placeholders));
      // Arabic plural forms may spell the number out ("يومين"), so {count} can be absent there.
      enPh.delete("count");
      arPh.delete("count");
      expect([...arPh].sort(), k).toEqual([...enPh].sort());
      expect(texts(a).flatMap(tags).filter((x, i, l) => l.indexOf(x) === i).sort(), k).toEqual(texts(v).flatMap(tags).filter((x, i, l) => l.indexOf(x) === i).sort());
    }
  });

  it("gives every Arabic plural all six forms", () => {
    for (const [k, v] of AR) {
      if (!isPlural(v)) continue;
      for (const cat of ["zero", "one", "two", "few", "many", "other"] as const) expect(v[cat], `${k}.${cat}`).toBeTruthy();
    }
  });
});

describe("translator", () => {
  const tEn = createTranslator("en", en);
  const tAr = createTranslator("ar", ar);

  it("interpolates placeholders", () => {
    expect(interpolate("Hi {name}", { name: "Sara" })).toBe("Hi Sara");
    expect(tEn.t("dashboard.greeting", { greeting: "Good morning", name: "Sara" })).toBe("Good morning, Sara.");
  });

  it("picks Arabic plural forms", () => {
    expect(tAr.plural("common.day", 1)).toBe("يوم واحد");
    expect(tAr.plural("common.day", 2)).toBe("يومين");
    expect(tAr.plural("common.day", 5)).toBe("5 أيام");
    expect(tAr.plural("common.day", 15)).toBe("15 يوم");
    expect(tEn.plural("common.day", 1)).toBe("1 day");
    expect(tEn.plural("common.day", 3)).toBe("3 days");
  });

  it("formats Arabic dates on the Gregorian calendar with Latin digits", () => {
    const d = new Date("2027-03-12T00:00:00Z");
    const s = tAr.formatDate(d);
    expect(s).toMatch(/2027/);
    expect(s).toMatch(/12/);
    expect(s).toMatch(/مارس/);
  });

  it("reads stage and plan names", () => {
    expect(tAr.stage(1, "name")).toBe("الكلمات الأولى");
    expect(tEn.stage(7, "name")).toBe("Mastery");
    expect(tEn.planText(12, "name")).toBe("Zero to IELTS");
    expect(tAr.duration(90)).toBe("1.5 ساعة");
  });
});

describe("first-visit language", () => {
  it("follows the browser: Arabic for ar-*, English otherwise", () => {
    expect(localeFromAcceptLanguage("ar-SA,ar;q=0.9,en;q=0.8")).toBe("ar");
    expect(localeFromAcceptLanguage("en-US,en;q=0.9,ar;q=0.5")).toBe("en");
    expect(localeFromAcceptLanguage("fr-FR,ar;q=0.8")).toBe("ar");
    expect(localeFromAcceptLanguage("fr-FR")).toBe("en");
    expect(localeFromAcceptLanguage(null)).toBe("en");
  });

  it("sets the text direction", () => {
    expect(dirOf("ar")).toBe("rtl");
    expect(dirOf("en")).toBe("ltr");
  });
});
