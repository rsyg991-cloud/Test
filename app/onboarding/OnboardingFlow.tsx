"use client";

import { useMemo, useState, useTransition } from "react";
import { savePlan, submitPlacement, type PlacementResult } from "@/app/actions/onboarding";
import { placement } from "@/content/placement";
import type { Skill } from "@/content/types";
import { Confetti } from "@/components/Celebration";
import { Icon } from "@/components/icons";
import { ListeningPlayer } from "@/components/task/ListeningPlayer";
import { QuestionList } from "@/components/task/QuestionList";
import { SpeakingTaskView } from "@/components/task/SpeakingTaskView";
import { WritingTaskView } from "@/components/task/WritingTaskView";
import { Logo, Ring, SKILL_META } from "@/components/ui";
import { addDays, formatDate } from "@/lib/dates";
import { PLANS, planDays, recommendPlan } from "@/lib/plan/scheduler";
import { cefrForBand, type Answers } from "@/lib/scoring";

const STEPS = ["Goal", "Grammar", "Reading", "Listening", "Writing", "Speaking", "Results", "Plan"] as const;
const STAGE_NAMES = ["Foundation", "Development", "Advanced", "Exam Mastery"];

export function OnboardingFlow({ name, initialResult }: { name: string; initialResult: PlacementResult | null }) {
  const [step, setStep] = useState(initialResult ? 6 : 0);
  const [target, setTarget] = useState(7);
  const [examDate, setExamDate] = useState<string>("");
  const [grammar, setGrammar] = useState<Answers>({});
  const [reading, setReading] = useState<Answers>({});
  const [listening, setListening] = useState<Answers>({});
  const [writingId, setWritingId] = useState<string>();
  const [speakingId, setSpeakingId] = useState<string>();
  const [result, setResult] = useState<PlacementResult | null>(initialResult);
  const [months, setMonths] = useState<number | null>(null);
  const [startStage, setStartStage] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const recommended = useMemo(
    () => (result ? recommendPlan(result.overall, target, examDate ? new Date(examDate) : null) : 3),
    [result, target, examDate],
  );
  const chosenMonths = months ?? recommended;
  const chosenStage = startStage ?? result?.recommendedStage ?? 1;

  const next = () => {
    setStep((s) => s + 1);
    window.scrollTo({ top: 0 });
  };

  function finishPlacement() {
    setError(null);
    start(async () => {
      try {
        const r = await submitPlacement({ grammar, reading, listening, writingAttemptId: writingId, speakingAttemptId: speakingId });
        setResult(r);
        setStep(6);
        window.scrollTo({ top: 0 });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  function confirmPlan() {
    start(async () => {
      await savePlan({ targetBand: target, examDate: examDate || null, months: chosenMonths, startStage: chosenStage });
    });
  }

  const placementStep = step >= 1 && step <= 5;

  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-4 pb-20 pt-6 sm:px-6">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Logo small />
        <span className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
          {placementStep ? `Placement test · ${step}/5` : STEPS[step]}
        </span>
      </div>
      <div className="mb-10 flex gap-1.5" aria-hidden="true">
        {STEPS.map((s, i) => (
          <span key={s} className="h-1.5 flex-1 rounded-full transition-colors" style={{ background: i <= step ? "var(--brand)" : "var(--surface-2)" }} />
        ))}
      </div>

      {step === 0 && (
        <section className="animate-rise">
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Hi {name}, let&apos;s plan your climb.</h1>
          <p className="mt-3 text-lg" style={{ color: "var(--muted)" }}>
            Two quick questions, then a 15-minute placement test to find your starting band.
          </p>
          <div className="card mt-8 p-6">
            <h2 className="font-bold">What band do you need?</h2>
            <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Target band">
              {[5.5, 6, 6.5, 7, 7.5, 8, 8.5].map((b) => (
                <button
                  key={b}
                  type="button"
                  role="radio"
                  aria-checked={target === b}
                  onClick={() => setTarget(b)}
                  className="rounded-2xl border-2 px-4 py-2.5 font-display text-xl font-bold transition-colors"
                  style={{ borderColor: target === b ? "var(--brand)" : "var(--line)", background: target === b ? "var(--brand)" : "transparent", color: target === b ? "#fff" : "var(--ink)" }}
                >
                  {b.toFixed(1)}
                </button>
              ))}
            </div>
            <h2 className="mt-8 font-bold">When is your exam?</h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input type="date" className="input w-auto" value={examDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setExamDate(e.target.value)} aria-label="Exam date" />
              {examDate && (
                <button type="button" className="text-sm font-semibold underline" onClick={() => setExamDate("")}>
                  I don&apos;t have a date yet
                </button>
              )}
              {!examDate && (
                <span className="text-sm" style={{ color: "var(--muted)" }}>
                  Optional — leave empty if you haven&apos;t booked yet.
                </span>
              )}
            </div>
          </div>
          <div className="card mt-5 flex flex-wrap items-center gap-4 p-5">
            {(["reading", "listening", "writing", "speaking"] as Skill[]).map((s) => (
              <span key={s} className="inline-flex items-center gap-2 text-sm font-semibold">
                <Icon name={SKILL_META[s].icon} size={16} style={{ color: SKILL_META[s].color }} /> {SKILL_META[s].label}
              </span>
            ))}
            <span className="text-sm" style={{ color: "var(--muted)" }}>
              + grammar · about 15 minutes · you can skip Writing and Speaking
            </span>
          </div>
          <div className="mt-8 flex justify-end">
            <button type="button" className="btn btn-primary px-6 py-3" onClick={next}>
              Start the placement test <Icon name="arrow" size={18} />
            </button>
          </div>
        </section>
      )}

      {step === 1 && (
        <Section title="Grammar & vocabulary" subtitle="Choose the best answer. Don't worry about getting everything right — this is about finding your level.">
          <QuestionList questions={placement.grammar} answers={grammar} onChange={(id, v) => setGrammar((a) => ({ ...a, [id]: v }))} />
          <Nav onNext={next} />
        </Section>
      )}

      {step === 2 && (
        <Section title="Reading" subtitle="Read the short text and answer the questions.">
          <article className="card prose-reading mb-6 p-6 text-[16px]">
            <h2 className="mb-3 font-display text-2xl font-bold">{placement.reading.title}</h2>
            {placement.reading.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </article>
          <QuestionList questions={placement.reading.questions} answers={reading} onChange={(id, v) => setReading((a) => ({ ...a, [id]: v }))} accent="var(--reading)" />
          <Nav onNext={next} />
        </Section>
      )}

      {step === 3 && (
        <Section title="Listening" subtitle="Play the recording and complete the notes. Use ONE WORD AND/OR A NUMBER.">
          <div className="mb-6">
            <ListeningPlayer task={placement.listening} revealScript={false} />
          </div>
          <QuestionList questions={placement.listening.questions} answers={listening} onChange={(id, v) => setListening((a) => ({ ...a, [id]: v }))} accent="var(--listening)" />
          <Nav onNext={next} />
        </Section>
      )}

      {step === 4 && (
        <Section title="Writing" subtitle="A short opinion paragraph. Our AI examiner will estimate your writing band.">
          <WritingTaskView task={placement.writing} source="placement" refId="placement" compact onEvaluated={(id) => setWritingId(id)} />
          <Nav onNext={next} nextLabel={writingId ? "Continue" : "Skip writing"} ghost={!writingId} />
        </Section>
      )}

      {step === 5 && (
        <Section title="Speaking" subtitle="Answer one question out loud for about a minute.">
          <SpeakingTaskView task={placement.speaking} source="placement" refId="placement" onEvaluated={(id) => setSpeakingId(id)} />
          {error && (
            <p role="alert" className="mt-4 font-semibold" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
          <div className="mt-8 flex flex-wrap justify-end gap-3">
            <button type="button" className={`btn ${speakingId ? "btn-primary" : "btn-ghost"} px-6 py-3`} onClick={finishPlacement} disabled={pending}>
              {pending ? "Calculating your bands…" : speakingId ? "See my results" : "Skip speaking & see results"} <Icon name="arrow" size={18} />
            </button>
          </div>
        </Section>
      )}

      {step === 6 && result && (
        <section className="animate-rise">
          <Confetti count={60} />
          <div className="text-center">
            <div className="eyebrow">Your starting point</div>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Band {result.overall.toFixed(1)} <span style={{ color: "var(--muted)" }}>·</span> {cefrForBand(result.overall)}
            </h1>
            <p className="mx-auto mt-3 max-w-lg" style={{ color: "var(--muted)" }}>
              Your target is <strong style={{ color: "var(--ink)" }}>Band {target.toFixed(1)}</strong>.{" "}
              {target > result.overall ? `That's a ${(target - result.overall).toFixed(1)}-band climb — very achievable with a clear plan.` : "You're already there — let's make it secure and push higher."}
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(["reading", "listening", "writing", "speaking"] as Skill[]).map((s, i) => (
              <div key={s} className="card animate-rise flex flex-col items-center p-5" style={{ animationDelay: `${i * 0.1}s` }}>
                <Ring value={result.bands[s] / 9} size={96} stroke={9} color={SKILL_META[s].color} label={`${SKILL_META[s].label} band ${result.bands[s]}`}>
                  <span className="font-display text-2xl font-bold">{result.bands[s].toFixed(1)}</span>
                </Ring>
                <div className="mt-3 font-bold">{SKILL_META[s].label}</div>
                {(s === "writing" || s === "speaking") && !result.aiUsed[s] && (
                  <div className="text-xs" style={{ color: "var(--muted)" }}>
                    estimated
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="card mt-6 p-5">
            <div className="flex items-start gap-3">
              <Icon name="sparkle" size={20} style={{ color: "var(--brand)", flexShrink: 0, marginTop: 2 }} />
              <p>
                We recommend starting at <strong>Stage {result.recommendedStage}: {STAGE_NAMES[result.recommendedStage - 1]}</strong>. Your weakest skill is{" "}
                <strong>{SKILL_META[(Object.entries(result.bands).sort((a, b) => a[1] - b[1])[0][0]) as Skill].label}</strong> — your daily sessions will give it extra attention.
              </p>
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button type="button" className="btn btn-primary px-6 py-3" onClick={next}>
              Choose my plan <Icon name="arrow" size={18} />
            </button>
          </div>
        </section>
      )}

      {step === 7 && (
        <section className="animate-rise">
          <h1 className="font-display text-4xl font-bold tracking-tight">How fast do you want to climb?</h1>
          <p className="mt-2" style={{ color: "var(--muted)" }}>
            All plans cover the full journey. You can change your plan at any time without losing progress.
          </p>
          <div className="mt-8 grid gap-3" role="radiogroup" aria-label="Study plan">
            {PLANS.map((p) => {
              const selected = chosenMonths === p.months;
              const end = addDays(new Date(), planDays(p.months) - 1);
              const tooLate = examDate ? end > new Date(examDate) : false;
              return (
                <button
                  key={p.months}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setMonths(p.months)}
                  className="card flex flex-wrap items-center gap-4 p-4 text-left transition-transform sm:flex-nowrap"
                  style={{ borderColor: selected ? "var(--brand)" : undefined, borderWidth: 2, transform: selected ? "scale(1.01)" : undefined }}
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl font-display text-2xl font-bold" style={{ background: selected ? "var(--brand)" : "var(--surface-2)", color: selected ? "#fff" : "var(--ink)" }}>
                    {p.months}
                    <span className="-mt-2 text-[10px] font-sans">{p.months === 1 ? "month" : "months"}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-bold">{p.name}</span>
                      {p.months === recommended && (
                        <span className="chip" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                          Recommended for you
                        </span>
                      )}
                      {tooLate && (
                        <span className="chip" style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)", color: "var(--danger)" }}>
                          Ends after your exam
                        </span>
                      )}
                    </span>
                    <span className="block text-sm" style={{ color: "var(--muted)" }}>
                      {p.bestFor}
                    </span>
                  </span>
                  <span className="text-right text-sm font-semibold">
                    <span className="block">~{p.dailyMinutes >= 60 ? `${p.dailyMinutes / 60}h` : `${p.dailyMinutes} min`}/day</span>
                    <span className="block" style={{ color: "var(--muted)" }}>
                      until {formatDate(end)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {result && result.recommendedStage > 1 && (
            <div className="card mt-6 p-5">
              <h2 className="font-bold">Where do you want to start?</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {[1, result.recommendedStage].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStartStage(s)}
                    className="rounded-xl border-2 px-4 py-2 text-sm font-bold"
                    style={{ borderColor: chosenStage === s ? "var(--brand)" : "var(--line)", background: chosenStage === s ? "var(--brand-soft)" : "transparent" }}
                  >
                    Stage {s}: {STAGE_NAMES[s - 1]} {s === result.recommendedStage ? "(recommended)" : "(from the beginning)"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button type="button" className="btn btn-primary px-6 py-3" onClick={confirmPlan} disabled={pending}>
              {pending ? "Building your plan…" : "Start my journey"} <Icon name="mountain" size={18} />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="animate-rise">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mb-8 mt-2" style={{ color: "var(--muted)" }}>
        {subtitle}
      </p>
      {children}
    </section>
  );
}

function Nav({ onNext, nextLabel = "Continue", ghost = false }: { onNext: () => void; nextLabel?: string; ghost?: boolean }) {
  return (
    <div className="mt-8 flex justify-end">
      <button type="button" className={`btn ${ghost ? "btn-ghost" : "btn-primary"} px-6 py-3`} onClick={onNext}>
        {nextLabel} <Icon name="arrow" size={18} />
      </button>
    </div>
  );
}
