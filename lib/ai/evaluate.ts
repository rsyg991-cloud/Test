import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { SpeakingTask, WritingTask } from "@/content/types";
import { clampBand } from "@/lib/scoring";
import { mockEvaluate } from "./mock";
import { EvaluationSchema, SPEAKING_CRITERIA, WRITING_CRITERIA, type Evaluation } from "./schema";

export const AI_MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";

export function aiEnabled() {
  return process.env.AI_MOCK !== "1" && Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

let client: Anthropic | null = null;
const getClient = () => (client ??= new Anthropic());

const SYSTEM = `You are a senior, certified IELTS examiner and an encouraging English coach on "BandUp", a platform that takes learners from B1 to Band 7+.

Assess the learner's response strictly against the public IELTS band descriptors. Be calibrated: do not inflate bands to be kind, and do not deflate them to motivate — learners rely on these numbers to judge their readiness for the real exam. Bands are whole or half numbers from 0 to 9.

Feedback rules:
- Write in clear, simple English that a B1–B2 learner can follow.
- Be specific: quote the learner's own words when pointing out a problem or a strength.
- "corrections" must use phrases copied exactly from the learner's response in "original"; choose the corrections that would raise the band most (errors that block meaning first, then repeated errors, then style).
- "improvements" are the three highest-impact next steps, most important first, each one an action the learner can practise.
- "upgraded_version" rewrites the learner's own response at roughly one band higher, keeping their ideas, structure and voice, so they can see exactly what the next level looks like. Do not write a completely different answer.
- If the response is off-topic, extremely short or not in English, reflect that honestly in the bands and explain why.`;

function extractEvaluation(parsed: Evaluation | null, criteriaNames: string[]): Evaluation {
  if (!parsed) throw new Error("The AI evaluator returned an unreadable result.");
  const criteria = criteriaNames.map((name, i) => {
    const c = parsed.criteria[i];
    return { name, band: clampBand(c?.band), comment: c?.comment ?? "" };
  });
  return {
    ...parsed,
    overall_band: clampBand(parsed.overall_band),
    criteria,
    corrections: parsed.corrections.slice(0, 8),
    improvements: parsed.improvements.slice(0, 3),
  };
}

async function callClaude(userContent: string, criteriaNames: string[]): Promise<Evaluation> {
  const response = await getClient().beta.messages.parse({
    model: AI_MODEL,
    max_tokens: 16000,
    // If a request is declined by a safety classifier, the API retries it on a fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(EvaluationSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: userContent }],
  });
  if (response.stop_reason === "refusal") {
    throw new Error("The evaluator could not assess this response. Please check it is an answer to the task and try again.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("The evaluation was cut short. Please try again.");
  }
  return extractEvaluation(response.parsed_output as Evaluation | null, criteriaNames);
}

export async function evaluateWriting(task: WritingTask, essay: string): Promise<Evaluation> {
  if (!aiEnabled()) return mockEvaluate("writing", essay, task.minWords);
  const words = essay.trim().split(/\s+/).filter(Boolean).length;
  const chart = task.chart
    ? `\n\nChart data (${task.chart.kind} chart, "${task.chart.title}", unit ${task.chart.unit}):\n` +
      task.chart.series
        .map((s) => `${s.name}: ` + task.chart!.labels.map((l, i) => `${l}=${s.values[i]}`).join(", "))
        .join("\n")
    : "";
  const content = `Assess this IELTS Academic Writing ${task.task === "task1" ? "Task 1" : "Task 2"} response.

Use these four criteria, in this order: ${WRITING_CRITERIA.join("; ")}.
Minimum length for this task: ${task.minWords} words. The response has ${words} words.

<task>
${task.prompt}${chart}
</task>

<response>
${essay}
</response>`;
  return callClaude(content, WRITING_CRITERIA);
}

export async function evaluateSpeaking(task: SpeakingTask, transcript: string, durationSec: number): Promise<Evaluation> {
  if (!aiEnabled()) return mockEvaluate("speaking", transcript, Math.round(task.speakSeconds * 1.6));
  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  const wpm = durationSec > 0 ? Math.round((words / durationSec) * 60) : 0;
  const content = `Assess this IELTS Speaking Part ${task.part} response.

You only have an automatic speech-to-text transcript, not the audio. Judge Fluency from the transcript, the speaking rate and the length; estimate Pronunciation cautiously (transcription errors such as odd or wrong words may hint at pronunciation problems) and say clearly in that criterion's comment that it is an estimate.
Use these four criteria, in this order: ${SPEAKING_CRITERIA.join("; ")}.

Questions asked:
${task.cueCard ? `Cue card: ${task.cueCard.topic}\nYou should say: ${task.cueCard.bullets.join("; ")}` : task.questions.map((q) => `- ${q}`).join("\n")}

Speaking time: ${durationSec} seconds (target about ${task.speakSeconds} seconds). Words: ${words}. Speaking rate: ${wpm} words per minute.

<transcript>
${transcript}
</transcript>`;
  return callClaude(content, SPEAKING_CRITERIA);
}
