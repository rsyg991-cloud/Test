import type { Question } from "./types";

export const mcq = (
  id: string,
  prompt: string,
  options: string[],
  answer: number,
  explanation: string,
  ar?: string,
): Question => ({ id, type: "mcq", prompt, options, answer, explanation, ...(ar ? { ar } : {}) });

export const tf = (
  id: string,
  prompt: string,
  answer: "TRUE" | "FALSE" | "NOT GIVEN",
  explanation: string,
  ar?: string,
): Question => ({ id, type: "tfng", prompt, answer, explanation, ...(ar ? { ar } : {}) });

export const gap = (
  id: string,
  prompt: string,
  answer: string | string[],
  explanation: string,
  ar?: string,
): Question => ({
  id,
  type: "gap",
  prompt,
  answer: Array.isArray(answer) ? answer : [answer],
  explanation,
  ...(ar ? { ar } : {}),
});

export const v = (word: string, definition: string, example: string, ar?: string) => ({
  word,
  definition,
  example,
  ...(ar ? { ar } : {}),
});
