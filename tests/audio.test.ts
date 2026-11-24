import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { stages } from "@/content";
import { spokenTexts } from "@/lib/audio/manifest";
import { audioPath, scriptVoices } from "@/lib/audio/voices";

describe("recorded audio (Kokoro)", () => {
  const texts = spokenTexts();
  const file = (path: string) => join(process.cwd(), "public", path);

  it("names a recording by its voice and text, ignoring spacing", () => {
    expect(audioPath("af_heart", "Hello there.")).toBe(audioPath("af_heart", "  Hello   there. "));
    expect(audioPath("af_heart", "Hello there.")).not.toBe(audioPath("am_michael", "Hello there."));
    expect(audioPath("af_heart", "Hello there.")).toMatch(/^\/audio\/af_heart\/[0-9a-z]+\.mp3$/);
    expect(new Set(texts.map((t) => t.path)).size).toBe(texts.length);
  });

  it("gives each speaker of a recording their own voice, different from others of their gender", () => {
    const v = scriptVoices([
      { speaker: "A", voice: "female", text: "1" },
      { speaker: "B", voice: "female", text: "2" },
      { speaker: "C", voice: "male", text: "3" },
      { speaker: "A", voice: "female", text: "4" },
    ]);
    expect(v[0]).toBe(v[3]);
    expect(v[0]).not.toBe(v[1]);
    expect(v[2].startsWith("am_") || v[2].startsWith("bm_")).toBe(true);
  });

  it("has a recording for every line of every lesson and checkpoint recording", () => {
    const lines = stages.flatMap((s) => [...s.units.flatMap((u) => u.lessons), s.checkpoint]).flatMap((x) => {
      const task = "listening" in x ? x.listening : undefined;
      if (!task) return [];
      const voices = scriptVoices(task.script);
      return task.script.map((l, i) => audioPath(voices[i], l.text));
    });
    expect(lines.length).toBeGreaterThan(100);
    expect(lines.filter((p) => !existsSync(file(p)))).toEqual([]);
  });

  it("has recordings for (nearly) everything the site says; the rest falls back to the browser's voice", () => {
    // Re-run scripts/audio/generate.py after changing spoken content (see its header).
    const missing = texts.filter((t) => !existsSync(file(t.path)));
    expect(missing.length / texts.length, missing.slice(0, 5).map((m) => m.text).join(" | ")).toBeLessThan(0.02);
  });
});

describe("Stage 0 letter sounds", () => {
  it("has a recorded sound for every grapheme Stage 0 teaches", async () => {
    const { GRAPHEMES } = await import("@/content/items");
    const { soundPath } = await import("@/lib/audio/voices");
    const missing = GRAPHEMES.filter((g) => !existsSync(join(process.cwd(), "public", soundPath(g.id))));
    expect(missing.map((g) => g.id)).toEqual([]);
    expect(new Set(GRAPHEMES.map((g) => soundPath(g.id))).size).toBe(GRAPHEMES.length);
  });
});
