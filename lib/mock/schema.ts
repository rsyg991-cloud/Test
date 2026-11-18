import { z } from "zod";

/**
 * Full IELTS test format. One schema drives the TypeScript types, the exam UI,
 * grading and the validator for imported (licensed) tests.
 */

export const OptionSchema = z.object({ key: z.string().min(1), text: z.string().min(1) });

export const WordLimitSchema = z.object({
  words: z.number().int().min(1).max(5),
  number: z.boolean().default(false), // "AND/OR A NUMBER"
});

export const MockQuestionSchema = z.object({
  n: z.number().int().min(1).max(40),
  /** Text shown for the question. Completion questions mark the gap with ___ */
  prompt: z.string().default(""),
  /** Optional heading shown above this question (e.g. a note-section title). */
  section: z.string().optional(),
  /** Per-question options (mcq). */
  options: z.array(OptionSchema).optional(),
  /** Accepted answers. Option keys for choice types; alternative spellings for text types. */
  answer: z.array(z.string().min(1)).min(1),
  explanation: z.string().optional(),
});

export const QuestionTypeSchema = z.enum([
  "mcq",
  "mcq-multi",
  "tfng",
  "ynng",
  "matching",
  "completion",
  "completion-box",
  "labelling",
  "short-answer",
]);

export const ImageSchema = z.object({
  /** Path under /public (e.g. /mock/original-1/map.svg) or an absolute URL for licensed assets. */
  src: z.string().min(1),
  alt: z.string().min(1),
});

export const QuestionGroupSchema = z.object({
  id: z.string().min(1),
  type: QuestionTypeSchema,
  /** Official-style instructions, e.g. "Complete the form below. Write ONE WORD AND/OR A NUMBER for each answer." */
  instructions: z.string().min(1),
  title: z.string().optional(),
  /** For mcq-multi: the shared question text. */
  prompt: z.string().optional(),
  wordLimit: WordLimitSchema.optional(),
  /** Shared option list (matching, completion-box word bank, labelling letters, mcq-multi choices). */
  options: z.array(OptionSchema).optional(),
  allowReuse: z.boolean().optional(),
  image: ImageSchema.optional(),
  questions: z.array(MockQuestionSchema).min(1),
});

export const ScriptLineSchema = z.object({
  speaker: z.string(),
  voice: z.enum(["female", "male"]),
  text: z.string(),
});

export const ListeningPartSchema = z.object({
  part: z.number().int().min(1).max(4),
  context: z.string(),
  /** Real recording (licensed tests). If absent, the script is read aloud by the browser. */
  audioUrl: z.string().optional(),
  script: z.array(ScriptLineSchema).optional(),
  groups: z.array(QuestionGroupSchema).min(1),
});

export const ReadingPassageSchema = z.object({
  passage: z.number().int().min(1).max(3),
  title: z.string(),
  subtitle: z.string().optional(),
  /** Paragraphs; give them letters (A, B, …) when questions refer to paragraphs. */
  paragraphs: z.array(z.object({ label: z.string().optional(), text: z.string() })).min(1),
  groups: z.array(QuestionGroupSchema).min(1),
});

export const ChartDataSchema = z.object({
  kind: z.enum(["bar", "line", "table"]),
  title: z.string(),
  unit: z.string(),
  labels: z.array(z.string()),
  series: z.array(z.object({ name: z.string(), values: z.array(z.number()) })),
});

export const MockWritingTaskSchema = z.object({
  task: z.enum(["task1", "task2"]),
  prompt: z.string(),
  chart: ChartDataSchema.optional(),
  image: ImageSchema.optional(),
  /** Text description of an image (process, map…) so the AI evaluator can check accuracy. */
  imageDescription: z.string().optional(),
  minWords: z.number().int(),
});

export const FullTestSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  module: z.literal("academic"),
  description: z.string().optional(),
  source: z.object({
    kind: z.enum(["original", "licensed"]),
    publisher: z.string().optional(),
    book: z.string().optional(),
    testNumber: z.number().optional(),
    licenseRef: z.string().optional(),
    attribution: z.string().optional(),
  }),
  listening: z.array(ListeningPartSchema).length(4),
  reading: z.array(ReadingPassageSchema).length(3),
  writing: z.object({ task1: MockWritingTaskSchema, task2: MockWritingTaskSchema }),
  speaking: z.object({
    part1: z.array(z.string()).min(3),
    part2: z.object({ topic: z.string(), bullets: z.array(z.string()).min(3) }),
    part3: z.array(z.string()).min(3),
  }),
});

export type FullTest = z.infer<typeof FullTestSchema>;
export type FullTestInput = z.input<typeof FullTestSchema>;
export type QuestionGroup = z.infer<typeof QuestionGroupSchema>;
export type MockQuestion = z.infer<typeof MockQuestionSchema>;
export type ListeningPart = z.infer<typeof ListeningPartSchema>;
export type ReadingPassage = z.infer<typeof ReadingPassageSchema>;
export type MockWritingTask = z.infer<typeof MockWritingTaskSchema>;
export type QuestionType = z.infer<typeof QuestionTypeSchema>;
