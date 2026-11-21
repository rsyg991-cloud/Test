"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { completeLesson, type CompletionResult } from "@/app/actions/learn";
import type { Lesson } from "@/content/types";
import type { Answers } from "@/lib/scoring";
import { Celebration } from "../Celebration";
import { Icon } from "../icons";
import { ListeningPlayer } from "../task/ListeningPlayer";
import { TaskQuestions } from "../task/TaskQuestions";
import { taskAnsweredCount, taskQuestionCount } from "@/lib/taskGrade";
import { SpeakingTaskView } from "../task/SpeakingTaskView";
import { WritingTaskView } from "../task/WritingTaskView";
import { SKILL_META, SkillIcon } from "../ui";

type Step = "learn" | "task";

export function LessonPlayer({ lesson, stageName, previousBest }: { lesson: Lesson; stageName: string; previousBest: number | null }) {
  const [step, setStep] = useState<Step>("learn");
  const [answers, setAnswers] = useState<Answers>({});
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [result, setResult] = useState<CompletionResult | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const meta = SKILL_META[lesson.skill];
  const task = lesson.reading ?? lesson.listening;
  const totalQuestions = task ? taskQuestionCount(task) : 0;
  const answered = task ? taskAnsweredCount(task, answers) : 0;

  function finish(payload: { answers?: Answers; attemptId?: string }) {
    setError(null);
    start(async () => {
      const r = await completeLesson(lesson.id, payload);
      if (!r.ok) return setError(r.error);
      setResult(r);
      setShowCelebration(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }



  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/journey" className="grid h-10 w-10 place-items-center rounded-full" style={{ background: "var(--surface-2)" }} aria-label="Back to journey">
          <Icon name="back" size={18} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="eyebrow truncate">
            Stage {lesson.stage} · {stageName} · Unit {lesson.unit}
          </div>
          <div className="mt-1 flex gap-1.5" aria-label={`Step ${step === "learn" ? 1 : 2} of 2`}>
            {(["learn", "task"] as Step[]).map((s, i) => (
              <span key={s} className="h-1.5 flex-1 rounded-full" style={{ background: (step === "task" ? 2 : 1) > i || result ? meta.color : "var(--surface-2)" }} />
            ))}
          </div>
        </div>
      </div>

      <div className="mb-8 flex items-start gap-4">
        <SkillIcon skill={lesson.skill} size={56} />
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">{lesson.title}</h1>
          <p className="mt-1" style={{ color: "var(--muted)" }}>
            {lesson.focus} · ~{lesson.minutes} min · {lesson.xp} XP
            {previousBest !== null && ` · Best so far: ${Math.round(previousBest * 100)}%`}
          </p>
        </div>
      </div>

      {step === "learn" && (
        <div className="animate-rise grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <section className="card p-6">
            <div className="eyebrow mb-2" style={{ color: meta.color }}>
              Skill builder
            </div>
            <h2 className="mb-4 font-display text-xl">{lesson.strategy.title}</h2>
            <ol className="space-y-3">
              {lesson.strategy.points.map((p, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold text-[var(--on-skill)]" style={{ background: meta.color }}>
                    {i + 1}
                  </span>
                  <span className="pt-0.5 leading-relaxed">{p}</span>
                </li>
              ))}
            </ol>
            {lesson.arabic && (
              <details className="mt-5 rounded-md p-4" style={{ background: "var(--surface-2)" }} open={lesson.stage <= 2}>
                <summary className="cursor-pointer text-sm font-bold">
                  Explain in Arabic <span className="ar font-bold" lang="ar">· الشرح بالعربي</span>
                </summary>
                <div lang="ar" dir="rtl" className="ar mt-3">
                  <h3 className="text-lg font-bold">{lesson.arabic.title}</h3>
                  <ol className="mt-2 list-decimal space-y-1.5 pr-5">
                    {lesson.arabic.points.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ol>
                </div>
              </details>
            )}
          </section>
          <section className="card p-6">
            <div className="eyebrow mb-2" style={{ color: meta.color }}>
              Key vocabulary · tap to flip
            </div>
            <div className="grid gap-2.5">
              {lesson.vocab.map((v, i) => (
                <button
                  key={v.word}
                  type="button"
                  onClick={() => setFlipped((f) => ({ ...f, [i]: !f[i] }))}
                  className="rounded-md border p-3 text-left transition-colors"
                  style={{ borderColor: "var(--line)", background: flipped[i] ? meta.soft : "var(--surface)" }}
                  aria-expanded={!!flipped[i]}
                >
                  <div className="font-bold">{v.word}</div>
                  {flipped[i] ? (
                    <div className="mt-1 text-sm">
                      <div>{v.definition}</div>
                      {v.ar && (
                        <div className="ar mt-0.5 font-bold" lang="ar" dir="rtl">
                          {v.ar}
                        </div>
                      )}
                      <div className="mt-1 italic" style={{ color: "var(--muted)" }}>
                        “{v.example}”
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm" style={{ color: "var(--muted)" }}>
                      Can you guess the meaning?
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>
          <div className="flex justify-end lg:col-span-2">
            <button type="button" className="btn btn-primary" onClick={() => { setStep("task"); window.scrollTo({ top: 0 }); }}>
              I&apos;m ready — start the task <Icon name="arrow" size={18} />
            </button>
          </div>
        </div>
      )}

      {step === "task" && lesson.reading && (
        <div className="animate-rise grid gap-6 lg:grid-cols-2">
          <article className="card p-6 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto">
            <div className="eyebrow mb-2" style={{ color: meta.color }}>
              Reading passage · suggested time {lesson.reading.timeMinutes} min
            </div>
            <h2 className="mb-4 font-display text-2xl font-bold">{lesson.reading.title}</h2>
            <div className="prose-reading text-[16px]">
              {lesson.reading.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </article>
          {questionPanel()}
        </div>
      )}

      {step === "task" && lesson.listening && (
        <div className="animate-rise mx-auto max-w-3xl space-y-6">
          <ListeningPlayer task={lesson.listening} revealScript={!!result} />
          {questionPanel()}
        </div>
      )}

      {step === "task" && lesson.writing && (
        <div className="animate-rise mx-auto max-w-3xl">
          <WritingTaskView task={lesson.writing} source="lesson" refId={lesson.id} onEvaluated={(id) => setAttemptId(id)} />
          {completeBar()}
        </div>
      )}

      {step === "task" && lesson.speaking && (
        <div className="animate-rise mx-auto max-w-3xl">
          <SpeakingTaskView task={lesson.speaking} source="lesson" refId={lesson.id} onEvaluated={(id) => setAttemptId(id)} />
          {completeBar()}
        </div>
      )}

      {showCelebration && result && (
        <Celebration
          title={result.pct !== undefined ? (result.pct >= 0.8 ? "Outstanding!" : result.pct >= 0.5 ? "Lesson complete!" : "Good effort!") : "Lesson complete!"}
          subtitle={
            result.pct !== undefined
              ? `${result.correct}/${result.total} correct${result.pct < 0.5 ? " — review the explanations, then try again later." : ""}`
              : "Your feedback is saved in Progress."
          }
          band={result.band}
          xp={result.activity.xpGained}
          streak={result.activity.streak}
          streakExtended={result.activity.streakExtended}
          freezeEarned={result.activity.freezeEarned}
          vocabAdded={result.vocabAdded}
          nextHref={result.nextHref}
          nextTitle={result.nextHref === "/dashboard" ? "Back to today" : `Next: ${result.nextTitle}`}
          onClose={() => setShowCelebration(false)}
        />
      )}
    </div>
  );

  function questionPanel() {
    return (
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Questions</h2>
          <span className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
            {result ? `${result.correct}/${result.total} correct` : `${answered}/${totalQuestions} answered`}
          </span>
        </div>
        <TaskQuestions
          task={task!}
          section={lesson.reading ? "reading" : "listening"}
          answers={answers}
          onChange={(id, v) => setAnswers((a) => ({ ...a, [id]: v }))}
          results={result?.results}
          groupResults={result?.groupResults}
          accent={meta.color}
        />
        {error && (
          <p role="alert" className="mt-4 font-semibold" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {result ? (
            <>
              <Link href={result.nextHref} className="btn btn-primary">
                Continue <Icon name="arrow" size={18} />
              </Link>
            </>
          ) : (
            <button type="button" className="btn btn-primary" disabled={pending || answered === 0} onClick={() => finish({ answers })}>
              {pending ? "Checking…" : answered < totalQuestions ? `Check answers (${totalQuestions - answered} blank)` : "Check answers"}
            </button>
          )}
        </div>
      </section>
    );
  }

  function completeBar() {
    if (!attemptId) return null;
    return (
      <div className="mt-6 flex flex-col items-end gap-2">
        {error && (
          <p role="alert" className="font-semibold" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}
        {result ? (
          <Link href={result.nextHref} className="btn btn-primary">
            Continue <Icon name="arrow" size={18} />
          </Link>
        ) : (
          <button type="button" className="btn btn-primary" disabled={pending} onClick={() => finish({ attemptId: attemptId ?? undefined })}>
            {pending ? "Saving…" : "Complete lesson"} <Icon name="check" size={18} />
          </button>
        )}
      </div>
    );
  }
}
