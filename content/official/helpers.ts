import { QuestionGroupSchema, type QuestionGroup } from "@/lib/mock/schema";
import type { z } from "zod";

/** Build (and validate at load time) an official IELTS question group. */
export const G = (g: z.input<typeof QuestionGroupSchema>): QuestionGroup => QuestionGroupSchema.parse(g);

/** Options A, B, C… from a list of texts. */
export const letters = (...texts: string[]) => texts.map((text, i) => ({ key: String.fromCharCode(65 + i), text }));

export const romans = (...texts: string[]) =>
  texts.map((text, i) => ({ key: ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"][i], text }));

export const ONE_WORD = { words: 1, number: false };
export const ONE_WORD_OR_NUMBER = { words: 1, number: true };
export const TWO_WORDS = { words: 2, number: false };
