import type { Question } from "@/content/types";
import { answeredNumbers, gradeGroups, type MockAnswers, type MockResult } from "@/lib/mock/grade";
import type { QuestionGroup } from "@/lib/mock/schema";
import { gradeQuestions, type Answers, type QuestionResult } from "@/lib/scoring";

/** A lesson/checkpoint task: either simple questions (Stages 1–5) or official IELTS groups (Stages 6–7). */
export interface QuestionTask {
  questions: Question[];
  groups?: QuestionGroup[];
}

export interface TaskGrade {
  correct: number;
  total: number;
  pct: number;
  results?: QuestionResult[];
  groupResults?: MockResult[];
}

export function gradeTask(task: QuestionTask, answers: Answers): TaskGrade {
  if (task.groups?.length) {
    const g = gradeGroups(task.groups, answers as MockAnswers);
    return { correct: g.raw, total: g.total, pct: g.total ? g.raw / g.total : 0, groupResults: g.results };
  }
  const g = gradeQuestions(task.questions, answers);
  return { correct: g.correct, total: g.total, pct: g.pct, results: g.results };
}

export function taskQuestionCount(task: QuestionTask): number {
  return task.groups?.length ? task.groups.reduce((a, g) => a + g.questions.length, 0) : task.questions.length;
}

export function taskAnsweredCount(task: QuestionTask, answers: Answers): number {
  if (task.groups?.length) {
    const strAnswers = Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, String(v ?? "")]));
    return answeredNumbers(task.groups, strAnswers).size;
  }
  return task.questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== "").length;
}
