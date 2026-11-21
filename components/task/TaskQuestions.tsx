"use client";

import type { MockResult } from "@/lib/mock/grade";
import type { QuestionTask } from "@/lib/taskGrade";
import type { Answers, QuestionResult } from "@/lib/scoring";
import { QuestionGroupView } from "../mock/QuestionGroupView";
import { QuestionList } from "./QuestionList";

/** Renders a task's questions: official IELTS groups when present, otherwise the simple question list. */
export function TaskQuestions({
  task,
  section,
  answers,
  onChange,
  results,
  groupResults,
  accent,
}: {
  task: QuestionTask;
  section: "reading" | "listening";
  answers: Answers;
  onChange: (key: string, value: string | number) => void;
  results?: QuestionResult[];
  groupResults?: MockResult[];
  accent?: string;
}) {
  if (task.groups?.length) {
    const map = groupResults ? new Map(groupResults.map((r) => [r.n, r])) : undefined;
    const str = Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, String(v ?? "")]));
    return (
      <div className="space-y-4">
        {task.groups.map((g) => (
          <QuestionGroupView key={g.id} section={section} group={g} answers={str} onChange={onChange} results={map} />
        ))}
      </div>
    );
  }
  return <QuestionList questions={task.questions} answers={answers} onChange={onChange} results={results} accent={accent} />;
}
