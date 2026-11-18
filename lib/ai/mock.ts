import { roundBand } from "@/lib/scoring";
import { SPEAKING_CRITERIA, WRITING_CRITERIA, type Evaluation } from "./schema";

const LINKERS = [
  "however", "moreover", "furthermore", "therefore", "although", "whereas", "for example", "for instance",
  "in addition", "on the other hand", "as a result", "consequently", "in conclusion", "firstly", "secondly",
  "nevertheless", "despite", "while", "because", "which",
];

export function textStats(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  const unique = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z']/g, ""))).size;
  const lower = text.toLowerCase();
  const linkers = LINKERS.filter((l) => lower.includes(l)).length;
  const longWords = words.filter((w) => w.replace(/[^a-zA-Z]/g, "").length >= 8).length;
  return {
    words: words.length,
    sentences: sentences.length,
    avgSentence: sentences.length ? words.length / sentences.length : 0,
    lexicalVariety: words.length ? unique / words.length : 0,
    linkers,
    longWordRatio: words.length ? longWords / words.length : 0,
    paragraphs: text.split(/\n\s*\n/).filter((p) => p.trim()).length,
  };
}

/**
 * Offline demo evaluator, used when AI_MOCK=1 or no API key is configured.
 * It is a rough heuristic so the full experience can be tried locally — not a real assessment.
 */
export function mockEvaluate(kind: "writing" | "speaking", text: string, minWords: number): Evaluation {
  const s = textStats(text);
  const lengthScore = Math.min(1, s.words / Math.max(1, minWords));
  const variety = Math.min(1, s.lexicalVariety / 0.6);
  const cohesion = Math.min(1, s.linkers / 6);
  const complexity = Math.min(1, s.avgSentence / 18) * 0.5 + Math.min(1, s.longWordRatio / 0.18) * 0.5;
  const base = 3.5 + 4 * (0.3 * lengthScore + 0.25 * variety + 0.25 * cohesion + 0.2 * complexity);
  const names = kind === "writing" ? WRITING_CRITERIA : SPEAKING_CRITERIA;
  const bands = [
    roundBand(base + (lengthScore < 1 ? -0.5 : 0)),
    roundBand(base + (cohesion - 0.5)),
    roundBand(base + (variety - 0.5)),
    roundBand(base + (complexity - 0.5)),
  ].map((b) => Math.min(lengthScore < 0.8 ? 5.5 : 7.5, Math.max(3, b - 0.5)));
  const overall = roundBand(bands.reduce((a, b) => a + b, 0) / 4);

  return {
    demo: true,
    overall_band: overall,
    criteria: names.map((name, i) => ({
      name,
      band: bands[i],
      comment: [
        lengthScore < 1
          ? `Your response has ${s.words} words; aim for at least ${minWords} so every idea is fully developed.`
          : "Good length — your ideas have space to develop. Make sure each paragraph has one clear main idea.",
        s.linkers < 4
          ? "Use more linking devices (however, as a result, for instance) to guide the reader."
          : "You use a range of linking words. Check they show the right relationship between ideas.",
        s.lexicalVariety < 0.5
          ? "Several words are repeated. Try synonyms and topic-specific collocations."
          : "Reasonable range of vocabulary. Add a few precise, less common words.",
        s.avgSentence < 12
          ? "Most sentences are short. Combine some with relative clauses or conditionals."
          : "You attempt complex sentences — keep checking accuracy.",
      ][i],
    })),
    summary:
      "Demo estimate generated offline (no AI key configured). Connect the Claude API for a real examiner-style assessment with personalised corrections.",
    strengths: [
      s.words >= minWords ? "You met the word count." : "You produced a complete response under time pressure.",
      s.linkers >= 3 ? "You connected ideas with linking words." : "Your main message is clear.",
    ],
    improvements: [
      "Develop each main idea with an explanation and a specific example.",
      "Vary sentence structures: try a conditional, a relative clause and a passive.",
      "Proofread for articles, plurals and subject-verb agreement.",
    ],
    corrections: [],
    upgraded_version:
      "An upgraded model version of your answer appears here when the Claude API is connected.",
  };
}
