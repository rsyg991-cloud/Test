import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { ConversationScenario, SpeakingTask, WritingTask } from "@/content/types";
import { mockEvaluate } from "./mock";
import { normalizeEvaluation } from "./normalize";
import { CONVERSATION_CRITERIA, EvaluationSchema, SPEAKING_CRITERIA, WRITING_CRITERIA, type Evaluation } from "./schema";
import { evaluateViaWebhook, type EvalRequest } from "./webhook";

export const AI_MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";

export type Provider = "webhook" | "claude" | "mock";

/**
 * Which evaluator to use. AI_PROVIDER wins; otherwise an n8n webhook if configured,
 * then Claude if a key is present, otherwise the offline demo evaluator.
 */
export function activeProvider(): Provider {
  const p = process.env.AI_PROVIDER;
  if (p === "webhook" || p === "claude" || p === "mock") return p;
  if (process.env.AI_MOCK === "1") return "mock";
  if (process.env.N8N_EVAL_WEBHOOK_URL) return "webhook";
  if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) return "claude";
  return "mock";
}

export function aiEnabled() {
  return activeProvider() !== "mock";
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
- If the response is off-topic, extremely short or not in English, reflect that honestly in the bands and explain why.
- Reply with a single JSON object that matches the requested schema, with exactly four items in "criteria" in the order given.`;

const countWords = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

export function writingRequest(task: WritingTask, essay: string): EvalRequest {
  const words = countWords(essay);
  const chart = task.chart
    ? `\n\nChart data (${task.chart.kind} chart, "${task.chart.title}", unit ${task.chart.unit}):\n` +
      task.chart.series.map((s) => `${s.name}: ` + task.chart!.labels.map((l, i) => `${l}=${s.values[i]}`).join(", ")).join("\n")
    : task.imageDescription
      ? `\n\nThe task shows an image. Description of the image: ${task.imageDescription}`
      : "";
  return {
    kind: "writing",
    instructions: SYSTEM,
    criteria: WRITING_CRITERIA,
    meta: { task: task.task, minWords: task.minWords, words },
    input: `Assess this IELTS Academic Writing ${task.task === "task1" ? "Task 1" : "Task 2"} response.

Use these four criteria, in this order: ${WRITING_CRITERIA.join("; ")}.
Minimum length for this task: ${task.minWords} words. The response has ${words} words.

<task>
${task.prompt}${chart}
</task>

<response>
${essay}
</response>`,
  };
}

export function speakingRequest(task: SpeakingTask, transcript: string, durationSec: number): EvalRequest {
  const words = countWords(transcript);
  const wpm = durationSec > 0 ? Math.round((words / durationSec) * 60) : 0;
  return {
    kind: "speaking",
    instructions: SYSTEM,
    criteria: SPEAKING_CRITERIA,
    meta: { part: task.part, words, durationSec, wordsPerMinute: wpm },
    input: `Assess this IELTS Speaking Part ${task.part} response.

You only have an automatic speech-to-text transcript, not the audio. Judge Fluency from the transcript, the speaking rate and the length; estimate Pronunciation cautiously (transcription errors such as odd or wrong words may hint at pronunciation problems) and say clearly in that criterion's comment that it is an estimate.
Use these four criteria, in this order: ${SPEAKING_CRITERIA.join("; ")}.

Questions asked:
${task.cueCard ? `Cue card: ${task.cueCard.topic}\nYou should say: ${task.cueCard.bullets.join("; ")}` : task.questions.map((q) => `- ${q}`).join("\n")}

Speaking time: ${durationSec} seconds (target about ${task.speakSeconds} seconds). Words: ${words}. Speaking rate: ${wpm} words per minute.

<transcript>
${transcript}
</transcript>`,
  };
}

export function conversationRequest(s: ConversationScenario, transcript: string): EvalRequest {
  return {
    kind: "conversation",
    instructions: SYSTEM,
    criteria: CONVERSATION_CRITERIA,
    meta: { scenario: s.id, stage: s.stage, words: countWords(transcript) },
    input: `Assess the LEARNER's side of this role-play conversation, which they had with an AI chatbot (ChatGPT) to practise speaking. The transcript contains both speakers; judge only the learner's turns. It may come from voice mode (speech-to-text) or from typing.

Use these four criteria, in this order: ${CONVERSATION_CRITERIA.join("; ")}.
"Fluency and Interaction" covers how well the learner kept the conversation going, developed answers, asked questions and responded to the other speaker. "Use of Target Language" covers how many of the target phrases and words below were used naturally and correctly, and whether the missions were completed — name the ones that were missed in that comment.
The overall band is an IELTS Speaking estimate based on the first three criteria.

Scenario: ${s.title} — ${s.situation}
The learner's role: ${s.learnerRole}. The AI's role: ${s.aiRole}.
Target phrases: ${s.keyPhrases.map((p) => `"${p.phrase}"`).join(", ")}
Target words: ${s.vocab.map((v) => v.word).join(", ")}
Missions: ${s.missions.join("; ")}

In "upgraded_version", rewrite only the learner's turns from the conversation (one per line, starting with "You:") at about one band higher.

<transcript>
${transcript}
</transcript>`,
  };
}

async function viaClaude(req: EvalRequest): Promise<Evaluation> {
  const response = await getClient().beta.messages.parse({
    model: AI_MODEL,
    max_tokens: 16000,
    // If a request is declined by a safety classifier, the API retries it on a fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(EvaluationSchema) },
    system: req.instructions,
    messages: [{ role: "user", content: req.input }],
  });
  if (response.stop_reason === "refusal") {
    throw new Error("The evaluator could not assess this response. Please check it is an answer to the task and try again.");
  }
  if (response.stop_reason === "max_tokens") throw new Error("The evaluation was cut short. Please try again.");
  const parsed = response.parsed_output as Evaluation | null;
  if (!parsed) throw new Error("The AI evaluator returned an unreadable result.");
  return normalizeEvaluation(parsed, req.criteria);
}

/** Run an evaluation with the configured provider. */
export async function evaluate(req: EvalRequest, responseText: string, minWords: number): Promise<Evaluation> {
  const provider = activeProvider();
  if (provider === "webhook") {
    const url = process.env.N8N_EVAL_WEBHOOK_URL;
    if (!url) throw new Error("AI_PROVIDER is 'webhook' but N8N_EVAL_WEBHOOK_URL is not set.");
    return evaluateViaWebhook(req, { url, secret: process.env.N8N_WEBHOOK_SECRET || undefined });
  }
  if (provider === "claude") return viaClaude(req);
  return mockEvaluate(req.kind === "writing" ? "writing" : "speaking", responseText, minWords, req.criteria);
}

export const evaluateWriting = (task: WritingTask, essay: string) => evaluate(writingRequest(task, essay), essay, task.minWords);

export const evaluateSpeaking = (task: SpeakingTask, transcript: string, durationSec: number) =>
  evaluate(speakingRequest(task, transcript, durationSec), transcript, Math.round(task.speakSeconds * 1.6));

export const evaluateConversation = (s: ConversationScenario, transcript: string) =>
  evaluate(conversationRequest(s, transcript), transcript, s.turns * 18);
