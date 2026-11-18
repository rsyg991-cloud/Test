"use client";

import { useEffect, useState } from "react";
import type { WritingTask } from "@/content/types";
import type { Evaluation } from "@/lib/ai/schema";
import { ChartView } from "../ChartView";
import { Icon } from "../icons";
import { requestEvaluation, type EvalSource } from "./evaluate-client";
import { FeedbackCard } from "./FeedbackCard";
import { fmtTime, wordCount } from "./speech";

export function WritingTaskView({
  task,
  source,
  refId,
  onEvaluated,
  compact = false,
}: {
  task: WritingTask;
  source: EvalSource;
  refId: string;
  onEvaluated: (attemptId: string, evaluation: Evaluation) => void;
  compact?: boolean;
}) {
  const draftKey = `bandup:draft:${source}:${refId}`;
  const [text, setText] = useState("");
  const [started, setStarted] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) setText(saved);
    } catch {}
  }, [draftKey]);

  useEffect(() => {
    if (!started || evaluation) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [started, evaluation]);

  function update(v: string) {
    setText(v);
    if (!started) setStarted(Date.now());
    try {
      localStorage.setItem(draftKey, v);
    } catch {}
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const { attemptId, evaluation } = await requestEvaluation({ kind: "writing", source, refId, text });
      setEvaluation(evaluation);
      try {
        localStorage.removeItem(draftKey);
      } catch {}
      onEvaluated(attemptId, evaluation);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const words = wordCount(text);
  const remaining = task.timeMinutes * 60 - (started ? (now - started) / 1000 : 0);
  const enough = words >= task.minWords;

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="eyebrow mb-2" style={{ color: "var(--writing)" }}>
          {task.task === "task1" ? "Writing Task 1" : "Writing Task 2"} · {task.timeMinutes} minutes
        </div>
        <p className="font-semibold leading-relaxed">{task.prompt}</p>
        {task.chart && (
          <div className="mt-4">
            <ChartView chart={task.chart} />
          </div>
        )}
        {!compact && task.tips.length > 0 && (
          <details className="mt-4 rounded-xl p-3 text-sm" style={{ background: "var(--surface-2)" }}>
            <summary className="cursor-pointer font-bold">Planning tips</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5" style={{ color: "var(--muted)" }}>
              {task.tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </details>
        )}
      </div>

      {!evaluation && (
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5 text-sm font-semibold" style={{ borderColor: "var(--line)" }}>
            <span style={{ color: enough ? "var(--success)" : "var(--muted)" }}>
              {words} / {task.minWords} words {enough && "✓"}
            </span>
            <span className="inline-flex items-center gap-1.5" style={{ color: remaining < 0 ? "var(--danger)" : "var(--muted)" }} aria-live="off">
              <Icon name="calendar" size={14} /> {started ? (remaining >= 0 ? `${fmtTime(remaining)} left` : `${fmtTime(-remaining)} over`) : "Timer starts when you type"}
            </span>
          </div>
          <textarea
            value={text}
            onChange={(e) => update(e.target.value)}
            placeholder="Start writing your answer here…"
            aria-label="Your answer"
            className="block min-h-[340px] w-full resize-y bg-transparent p-4 text-[16px] leading-relaxed outline-none"
            spellCheck={false}
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4" style={{ borderColor: "var(--line)" }}>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Spell-check is off, just like the real exam. Your draft is saved on this device.
            </p>
            <button type="button" className="btn btn-primary" onClick={submit} disabled={busy || words < 20}>
              {busy ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> The examiner is reading…
                </>
              ) : (
                <>
                  <Icon name="sparkle" size={18} /> Get my band score
                </>
              )}
            </button>
          </div>
          {error && (
            <p role="alert" className="px-4 pb-4 text-sm font-semibold" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
        </div>
      )}

      {evaluation && (
        <>
          <details className="card p-4 text-sm">
            <summary className="cursor-pointer font-bold">Your answer ({words} words)</summary>
            <p className="mt-3 whitespace-pre-line leading-relaxed">{text}</p>
          </details>
          <FeedbackCard evaluation={evaluation} accent="var(--writing)" />
        </>
      )}
    </div>
  );
}
