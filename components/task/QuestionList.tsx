"use client";

import type { Question } from "@/content/types";
import type { Answers, QuestionResult } from "@/lib/scoring";
import { Icon } from "../icons";

export function QuestionList({
  questions,
  answers,
  onChange,
  results,
  accent = "var(--brand)",
}: {
  questions: Question[];
  answers: Answers;
  onChange: (id: string, value: string | number) => void;
  results?: QuestionResult[];
  accent?: string;
}) {
  const resultFor = (id: string) => results?.find((r) => r.id === id);
  const locked = !!results;

  return (
    <ol className="space-y-5">
      {questions.map((q, idx) => {
        const r = resultFor(q.id);
        return (
          <li key={q.id} className="rounded-[10px] border p-4" style={{ borderColor: r ? (r.correct ? "var(--success)" : "var(--danger)") : "var(--line)", background: "var(--surface)" }}>
            <div className="mb-3 flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold" style={{ background: "var(--surface-2)" }}>
                {idx + 1}
              </span>
              {q.type !== "gap" && <p className="pt-0.5 font-semibold leading-snug">{q.prompt}</p>}
              {q.type === "gap" && <GapPrompt q={q} value={String(answers[q.id] ?? "")} onChange={(v) => onChange(q.id, v)} disabled={locked} accent={accent} />}
            </div>

            {q.type === "mcq" && (
              <div className="grid gap-2" role="radiogroup" aria-label={`Question ${idx + 1}`}>
                {q.options.map((opt, i) => {
                  const selected = answers[q.id] !== undefined && Number(answers[q.id]) === i;
                  const isAnswer = locked && i === q.answer;
                  return (
                    <button
                      key={i}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={locked}
                      onClick={() => onChange(q.id, i)}
                      className="flex items-center gap-3 rounded-md border-2 px-3 py-2.5 text-left text-[15px] transition-colors"
                      style={{
                        borderColor: isAnswer ? "var(--success)" : selected ? accent : "var(--line)",
                        background: isAnswer ? "color-mix(in srgb, var(--success) 10%, transparent)" : selected ? `color-mix(in srgb, ${accent} 10%, transparent)` : "transparent",
                      }}
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-xs font-bold" style={{ background: "var(--surface-2)" }}>
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {q.type === "tfng" && (
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`Question ${idx + 1}`}>
                {(["TRUE", "FALSE", "NOT GIVEN"] as const).map((opt) => {
                  const selected = answers[q.id] === opt;
                  const isAnswer = locked && q.answer === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      disabled={locked}
                      onClick={() => onChange(q.id, opt)}
                      className="rounded-md border-[1.5px] px-3.5 py-1.5 text-xs font-bold tracking-wider"
                      style={{
                        borderColor: isAnswer ? "var(--success)" : selected ? accent : "var(--line)",
                        background: isAnswer ? "var(--success)" : selected ? accent : "transparent",
                        color: isAnswer || selected ? "var(--on-skill)" : "var(--ink)",
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {r && (
              <div className="mt-3 flex gap-2 rounded-md p-3 text-sm" style={{ background: "var(--surface-2)" }}>
                <Icon name={r.correct ? "check" : "x"} size={18} style={{ color: r.correct ? "var(--success)" : "var(--danger)", flexShrink: 0, marginTop: 1 }} />
                <div>
                  {!r.correct && (
                    <div className="mb-1 font-semibold">
                      Answer: <span style={{ color: "var(--success)" }}>{r.expected}</span>
                      {r.given && (
                        <span style={{ color: "var(--muted)" }}>
                          {" "}
                          · you wrote <span className="line-through">{r.given}</span>
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ color: "var(--muted)" }}>{r.explanation}</div>
                  {r.ar && (
                    <p className="ar mt-1 text-sm" lang="ar" dir="rtl" style={{ color: "var(--ink)" }}>
                      {r.ar}
                    </p>
                  )}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function GapPrompt({
  q,
  value,
  onChange,
  disabled,
  accent,
}: {
  q: Extract<Question, { type: "gap" }>;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  accent: string;
}) {
  const [before, after] = q.prompt.split("___");
  return (
    <p className="pt-0.5 font-semibold leading-loose">
      {before}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label={q.prompt.replace("___", "blank")}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        className="mx-1 w-36 rounded-lg border-b-2 bg-transparent px-2 py-0.5 text-center font-semibold outline-none"
        style={{ borderColor: accent, background: "var(--surface-2)" }}
      />
      {after}
    </p>
  );
}
