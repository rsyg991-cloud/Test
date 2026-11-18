import type { Question } from "./types";

export const mcq = (
  id: string,
  prompt: string,
  options: string[],
  answer: number,
  explanation: string,
): Question => ({ id, type: "mcq", prompt, options, answer, explanation });

export const tf = (
  id: string,
  prompt: string,
  answer: "TRUE" | "FALSE" | "NOT GIVEN",
  explanation: string,
): Question => ({ id, type: "tfng", prompt, answer, explanation });

export const gap = (
  id: string,
  prompt: string,
  answer: string | string[],
  explanation: string,
): Question => ({
  id,
  type: "gap",
  prompt,
  answer: Array.isArray(answer) ? answer : [answer],
  explanation,
});

export const v = (word: string, definition: string, example: string) => ({
  word,
  definition,
  example,
});
