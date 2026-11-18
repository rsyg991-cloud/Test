import { z } from "zod";

const Criterion = z.object({
  name: z.string().describe("Official IELTS criterion name"),
  band: z.number().describe("Band for this criterion, 0-9 in steps of 0.5"),
  comment: z.string().describe("Two or three sentences of specific, actionable feedback"),
});

const Correction = z.object({
  original: z.string().describe("Exact phrase copied from the learner's answer"),
  corrected: z.string().describe("Improved version of that phrase"),
  explanation: z.string().describe("Short reason for the change"),
});

export const EvaluationSchema = z.object({
  overall_band: z.number().describe("Overall band for this response, 0-9 in steps of 0.5"),
  criteria: z.array(Criterion).describe("Exactly four criteria"),
  summary: z.string().describe("Two-sentence summary of the performance, encouraging but honest"),
  strengths: z.array(z.string()).describe("2-3 specific strengths"),
  improvements: z.array(z.string()).describe("3 highest-impact next steps, most important first"),
  corrections: z.array(Correction).describe("Up to 8 of the most important language corrections"),
  upgraded_version: z
    .string()
    .describe("The learner's own answer rewritten at about one band higher, keeping their ideas and structure"),
});

export type Evaluation = z.infer<typeof EvaluationSchema> & {
  /** true when produced by the offline demo evaluator instead of Claude */
  demo?: boolean;
};

export const WRITING_CRITERIA = [
  "Task Achievement / Response",
  "Coherence and Cohesion",
  "Lexical Resource",
  "Grammatical Range and Accuracy",
];

export const CONVERSATION_CRITERIA = [
  "Fluency and Interaction",
  "Lexical Resource",
  "Grammatical Range and Accuracy",
  "Use of Target Language",
];

export const SPEAKING_CRITERIA = [
  "Fluency and Coherence",
  "Lexical Resource",
  "Grammatical Range and Accuracy",
  "Pronunciation (estimated)",
];
