/**
 * Every text the site speaks, with the voice that speaks it: what scripts/audio/generate.py records.
 * It mirrors what the players pass to speak() (components/task/speech.ts). A text left out here just
 * falls back to the browser's voice, it never breaks; tests/audio.test.ts checks the coverage.
 */
import { allLessons, generalCheckpoints, generalLessons, practicePrompts, stages } from "@/content";
import { builtInTests } from "@/content/mock";
import { placement } from "@/content/placement";
import { stage0Lessons } from "@/content/stage0";
import { lessonView } from "@/lib/stage0/view";
import { audioPath, defaultVoice, normaliseSpoken, scriptVoices, type Gender } from "./voices";

export interface SpokenText {
  voice: string;
  text: string;
  /** Where the recording lives, under public/. */
  path: string;
}

export function spokenTexts(): SpokenText[] {
  const out = new Map<string, { voice: string; text: string; path: string }>();
  const add = (voice: string, text: string) => {
    const t = normaliseSpoken(text);
    if (!t) return;
    const path = audioPath(voice, t);
    out.set(path, { voice, text: t, path });
  };

  type Line = { speaker: string; voice: Gender; text: string };
  const isScript = (v: unknown): v is Line[] =>
    Array.isArray(v) && v.length > 0 && v.every((l) => l && typeof l === "object" && typeof l.text === "string" && (l.voice === "female" || l.voice === "male"));

  /** Walks any content object: recordings, speaking questions, vocabulary words. */
  function walk(v: unknown, seen = new Set<unknown>()): void {
    if (!v || typeof v !== "object" || seen.has(v)) return;
    seen.add(v);
    if (Array.isArray(v)) return v.forEach((x) => walk(x, seen));
    const o = v as Record<string, unknown>;
    if (isScript(o.script)) {
      const voices = scriptVoices(o.script);
      o.script.forEach((l, i) => add(voices[i], l.text));
    }
    // Speaking tasks: SpeakingTaskView reads the cue card (as one text) or each question.
    if (Array.isArray(o.questions) && typeof o.prepSeconds === "number") {
      const cue = o.cueCard as { topic: string; bullets: string[] } | undefined;
      if (cue) add(defaultVoice("female"), `${cue.topic} You should say: ${cue.bullets.join(", ")}.`);
      else for (const q of o.questions) if (typeof q === "string") add(defaultVoice("female"), q.replace(/^\(Part \d\)\s*/, ""));
    }
    // Vocabulary cards: the word is read on its own.
    if (typeof o.word === "string" && typeof o.definition === "string") add(defaultVoice("female"), o.word);
    for (const x of Object.values(o)) walk(x, seen);
  }

  walk([allLessons, generalLessons, stages.map((s) => s.checkpoint), generalCheckpoints, placement, practicePrompts, builtInTests]);

  // Stage 1 reading passages, read aloud for learners with reading supports (LessonPlayer).
  for (const l of allLessons) if (l.id.startsWith("f1-") && l.reading) add(defaultVoice("female"), [l.reading.title, ...l.reading.paragraphs].join(". "));

  // Stage 0: everything the player says (components/stage0/Stage0Player.tsx).
  const join = (ids: readonly string[], items: Record<string, { say: string }>) => ids.map((id) => items[id]?.say ?? "").join(" ");
  for (const lesson of stage0Lessons) {
    for (const { step: s, items, soundKeyword } of lessonView(lesson)) {
      for (const it of Object.values(items)) if (it.say) add(defaultVoice(), it.say);
      if (soundKeyword) add(defaultVoice(), soundKeyword);
      if ("tokens" in s) add(defaultVoice(), join(s.tokens, items));
      if (s.type === "say") add(defaultVoice(), join(s.model, items));
      if (s.type === "namePick") for (const o of s.options) add(defaultVoice(), o.toUpperCase());
      if (s.type === "nameSpellPick") for (const o of [s.target, ...s.options]) add(defaultVoice(), (items[o]?.text ?? "").toUpperCase().split("").join(", "));
    }
  }
  for (const c of "abcdefghijklmnopqrstuvwxyz") add(defaultVoice(), c.toUpperCase());
  return [...out.values()].sort((a, b) => a.path.localeCompare(b.path));
}
