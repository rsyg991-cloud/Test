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
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { addDays } from "@/lib/dates";
import { useT } from "@/lib/i18n/client";
import { endStageFor, FINAL_STAGE, pathItemCount, SELF_LEVELS, TARGET_BANDS } from "@/content/stageList";
import { paceLevel, PLANS, planDays, recommendPlan } from "@/lib/plan/scheduler";
import { cefrForBand, type Answers } from "@/lib/scoring";

const STEPS = ["goal", "grammar", "reading", "listening", "writing", "speaking", "results", "plan"] as const;
const SKILLS: Skill[] = ["reading", "listening", "writing", "speaking"];
type SelfLevel = (typeof SELF_LEVELS)[number]["id"];

export function OnboardingFlow({ name, initialResult }: { name: string; initialResult: PlacementResult | null }) {
  const { t, rich, stage, planText, duration, plural, formatDate, locale } = useT();
  const en = locale === "en";
  const [step, setStep] = useState(initialResult ? 6 : 0);
  const [target, setTarget] = useState(6.5);
  const [level, setLevel] = useState<SelfLevel | null>(initialResult ? "b1" : null);
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

  const self = SELF_LEVELS.find((l) => l.id === level);
  const selfPlaced = !!self && self.stage !== null && !result;
  const currentBand = result?.overall ?? self?.band ?? null;
  const recommendedStage = result?.recommendedStage ?? self?.stage ?? 1;
  const recommended = useMemo(
    () => recommendPlan(currentBand, target, examDate ? new Date(examDate) : null),
    [currentBand, target, examDate],
  );
  const chosenMonths = months ?? recommended;
  const chosenStage = startStage ?? recommendedStage;
  const endStage = Math.max(chosenStage, endStageFor(target));
  const pathItems = pathItemCount(chosenStage, endStage);
  const chosenPace = paceLevel(chosenMonths, pathItems);
  const stageChoices = [...new Set([1, recommendedStage - 1, recommendedStage, recommendedStage + 1])].filter((s) => s >= 1 && s <= FINAL_STAGE).sort((a, b) => a - b);

  function skipToPlan() {
    setStep(7);
    window.scrollTo({ top: 0 });
  }

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
        setError(e instanceof Error ? e.message : t("errors.generic"));
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
        <span className="flex items-center gap-3 text-sm font-semibold" style={{ color: "var(--muted)" }}>
          {placementStep ? t("onboarding.placementStep", { n: step }) : t(`onboarding.steps.${STEPS[step]}`)}
          <LanguageSwitch className="px-2.5 py-1.5 text-xs" />
        </span>
      </div>
      <div className="mb-10 flex gap-1.5" aria-hidden="true">
        {STEPS.map((s, i) => (
          <span key={s} className="h-1.5 flex-1 rounded-full transition-colors" style={{ background: i <= step ? "var(--brand)" : "var(--surface-2)" }} />
        ))}
      </div>

      {step === 0 && (
        <section className="animate-rise">
          <h1 className="font-display text-4xl sm:text-5xl">{rich("onboarding.hello", { name })}</h1>
          <p className="mt-3 text-lg" style={{ color: "var(--muted)" }}>
            {t("onboarding.intro")}
          </p>
          <div className="card mt-8 p-6">
            <h2 className="font-bold">{t("onboarding.levelQuestion")}</h2>
            {en && (
              <p className="ar mt-1 text-sm" lang="ar" dir="rtl" style={{ color: "var(--muted)" }}>
                كم تعرف من الإنجليزي الآن؟ اختر الأقرب لك، ولا تقلق إذا كنت مبتدئاً تماماً.
              </p>
            )}
            <div className="mt-4 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label={t("onboarding.levelLabel")}>
              {SELF_LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  role="radio"
                  aria-checked={level === l.id}
                  onClick={() => setLevel(l.id)}
                  className="rounded-md border-[1.5px] px-4 py-3 text-start transition-colors"
                  style={{ borderColor: level === l.id ? "var(--brand)" : "var(--line)", background: level === l.id ? "var(--brand-soft)" : "transparent" }}
                >
                  <span className="block font-bold">{t(`onboarding.levels.${l.id}.label`)}</span>
                  <span className="block text-sm" style={{ color: "var(--muted)" }}>
                    {t(`onboarding.levels.${l.id}.detail`)}
                  </span>
                  {en && (
                    <span className="ar mt-0.5 block text-sm" lang="ar" dir="rtl" style={{ color: "var(--muted)" }}>
                      {l.ar}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <h2 className="mt-8 font-bold">{t("onboarding.targetQuestion")}</h2>
            <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label={t("onboarding.targetLabel")}>
              {TARGET_BANDS.map((b) => (
                <button
                  key={b}
                  type="button"
                  role="radio"
                  aria-checked={target === b}
                  onClick={() => setTarget(b)}
                  className="num rounded-md border-[1.5px] px-3.5 py-2 text-lg font-bold transition-colors"
                  style={{ borderColor: target === b ? "var(--brand)" : "var(--line)", background: target === b ? "var(--brand)" : "transparent", color: target === b ? "var(--brand-ink)" : "var(--ink)" }}
                >
                  {b.toFixed(1)}
                </button>
              ))}
            </div>
            <h2 className="mt-8 font-bold">{t("onboarding.examQuestion")}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input type="date" className="input w-auto" value={examDate} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setExamDate(e.target.value)} aria-label={t("onboarding.examLabel")} />
              {examDate && (
                <button type="button" className="text-sm font-semibold underline" onClick={() => setExamDate("")}>
                  {t("onboarding.noDate")}
                </button>
              )}
              {!examDate && (
                <span className="text-sm" style={{ color: "var(--muted)" }}>
                  {t("onboarding.examOptional")}
                </span>
              )}
            </div>
          </div>
          {level === "b1" && (
          <div className="card mt-5 flex flex-wrap items-center gap-4 p-5">
            {SKILLS.map((s) => (
              <span key={s} className="inline-flex items-center gap-2 text-sm font-semibold">
                <Icon name={SKILL_META[s].icon} size={16} style={{ color: SKILL_META[s].color }} /> {t(`skills.${s}`)}
              </span>
            ))}
            <span className="text-sm" style={{ color: "var(--muted)" }}>
              {t("onboarding.placementInfo")}
            </span>
          </div>
          )}
          <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
            {selfPlaced && (
              <button type="button" className="btn btn-ghost px-5 py-3" onClick={next}>
                {t("onboarding.takePlacementInstead")}
              </button>
            )}
            <button type="button" className="btn btn-primary px-6 py-3" onClick={selfPlaced ? skipToPlan : next} disabled={!level}>
              {!level ? t("onboarding.chooseLevel") : selfPlaced ? t("onboarding.buildPlan") : t("onboarding.startPlacement")} <Icon name="arrow" size={18} />
            </button>
          </div>
        </section>
      )}

      {step === 1 && (
        <Section title={t("onboarding.grammarTitle")} subtitle={t("onboarding.grammarSubtitle")}>
          <QuestionList questions={placement.grammar} answers={grammar} onChange={(id, v) => setGrammar((a) => ({ ...a, [id]: v }))} />
          <Nav onNext={next} />
        </Section>
      )}

      {step === 2 && (
        <Section title={t("onboarding.readingTitle")} subtitle={t("onboarding.readingSubtitle")}>
          <article className="card prose-reading mb-6 p-6 text-[16px]" lang="en" dir="ltr">
            <h2 className="mb-3 font-display text-2xl">{placement.reading.title}</h2>
            {placement.reading.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </article>
          <QuestionList questions={placement.reading.questions} answers={reading} onChange={(id, v) => setReading((a) => ({ ...a, [id]: v }))} accent="var(--reading)" />
          <Nav onNext={next} />
        </Section>
      )}

      {step === 3 && (
        <Section title={t("onboarding.listeningTitle")} subtitle={t("onboarding.listeningSubtitle")}>
          <div className="mb-6">
            <ListeningPlayer task={placement.listening} revealScript={false} />
          </div>
          <QuestionList questions={placement.listening.questions} answers={listening} onChange={(id, v) => setListening((a) => ({ ...a, [id]: v }))} accent="var(--listening)" />
          <Nav onNext={next} />
        </Section>
      )}

      {step === 4 && (
        <Section title={t("onboarding.writingTitle")} subtitle={t("onboarding.writingSubtitle")}>
          <WritingTaskView task={placement.writing} source="placement" refId="placement" compact onEvaluated={(id) => setWritingId(id)} />
          <Nav onNext={next} nextLabel={writingId ? t("common.continue") : t("onboarding.skipWriting")} ghost={!writingId} />
        </Section>
      )}

      {step === 5 && (
        <Section title={t("onboarding.speakingTitle")} subtitle={t("onboarding.speakingSubtitle")}>
          <SpeakingTaskView task={placement.speaking} source="placement" refId="placement" onEvaluated={(id) => setSpeakingId(id)} />
          {error && (
            <p role="alert" className="mt-4 font-semibold" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
          <div className="mt-8 flex flex-wrap justify-end gap-3">
            <button type="button" className={`btn ${speakingId ? "btn-primary" : "btn-ghost"} px-6 py-3`} onClick={finishPlacement} disabled={pending}>
              {pending ? t("onboarding.calculating") : speakingId ? t("onboarding.seeResults") : t("onboarding.skipSpeaking")} <Icon name="arrow" size={18} />
            </button>
          </div>
        </Section>
      )}

      {step === 6 && result && (
        <section className="animate-rise">
          <Confetti count={60} />
          <div className="text-center">
            <div className="eyebrow">{t("onboarding.startingPoint")}</div>
            <h1 className="mt-2 font-display text-4xl sm:text-5xl" dir="ltr">
              Band <span className="num">{result.overall.toFixed(1)}</span> <span style={{ color: "var(--muted)" }}>·</span> {cefrForBand(result.overall)}
            </h1>
            <p className="mx-auto mt-3 max-w-lg" style={{ color: "var(--muted)" }}>
              {rich("onboarding.targetIs", { band: target.toFixed(1) })}{" "}
              {target > result.overall
                ? target - result.overall > 2
                  ? t("onboarding.longClimb", { gap: (target - result.overall).toFixed(1) })
                  : t("onboarding.climb", { gap: (target - result.overall).toFixed(1) })
                : t("onboarding.alreadyThere")}
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {SKILLS.map((s, i) => (
              <div key={s} className="card animate-rise flex flex-col items-center p-5" style={{ animationDelay: `${i * 0.1}s` }}>
                <Ring value={result.bands[s] / 9} size={96} stroke={9} color={SKILL_META[s].color} label={t("onboarding.skillBandLabel", { skill: t(`skills.${s}`), band: result.bands[s] })}>
                  <span className="num text-2xl font-bold">{result.bands[s].toFixed(1)}</span>
                </Ring>
                <div className="mt-3 font-bold">{t(`skills.${s}`)}</div>
                {(s === "writing" || s === "speaking") && !result.aiUsed[s] && (
                  <div className="text-xs" style={{ color: "var(--muted)" }}>
                    {t("common.estimated")}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="card mt-6 p-5">
            <div className="flex items-start gap-3">
              <Icon name="sparkle" size={20} style={{ color: "var(--brand)", flexShrink: 0, marginTop: 2 }} />
              <p>
                {rich("onboarding.recommendStart", {
                  n: result.recommendedStage,
                  stage: stage(result.recommendedStage, "name"),
                  skill: t(`skills.${Object.entries(result.bands).sort((a, b) => a[1] - b[1])[0][0] as Skill}`),
                })}
              </p>
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button type="button" className="btn btn-primary px-6 py-3" onClick={next}>
              {t("onboarding.choosePlan")} <Icon name="arrow" size={18} />
            </button>
          </div>
        </section>
      )}

      {step === 7 && (
        <section className="animate-rise">
          <h1 className="font-display text-4xl">{t("onboarding.paceTitle")}</h1>
          <p className="mt-2" style={{ color: "var(--muted)" }}>
            {rich("onboarding.pathSummary", {
              from: chosenStage,
              fromName: stage(chosenStage, "name"),
              to: endStage,
              toName: stage(endStage, "name"),
              band: target.toFixed(1),
              items: pathItems,
            })}
          </p>
          {selfPlaced && (
            <p className={`mt-3 text-sm ${en ? "ar" : ""}`} lang="ar" dir="rtl" style={{ color: "var(--muted)" }}>
              {en ? "المراحل الأولى فيها شرح بالعربي لكل درس، ويقلّ الشرح العربي تدريجياً كلما تقدّمت." : t("onboarding.arabicNote")}
            </p>
          )}
          <div className="mt-8 grid gap-3" role="radiogroup" aria-label={t("onboarding.planLabel")}>
            {PLANS.map((p) => {
              const selected = chosenMonths === p.months;
              const end = addDays(new Date(), planDays(p.months) - 1);
              const tooLate = examDate ? end > new Date(examDate) : false;
              const pace = paceLevel(p.months, pathItems);
              return (
                <button
                  key={p.months}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setMonths(p.months)}
                  className="card flex flex-wrap items-center gap-4 p-4 text-start transition-transform sm:flex-nowrap"
                  style={{ borderColor: selected ? "var(--brand)" : undefined, borderWidth: 2, transform: selected ? "scale(1.01)" : undefined }}
                >
                  <span className="num grid h-14 w-14 shrink-0 place-items-center rounded-md text-2xl font-bold" style={{ background: selected ? "var(--brand)" : "var(--surface-2)", color: selected ? "var(--brand-ink)" : "var(--ink)" }}>
                    {p.months}
                    <span className="-mt-2 font-sans text-[10px]">{plural("common.monthUnit", p.months)}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-bold">{planText(p.months, "name")}</span>
                      {p.months === recommended && (
                        <span className="chip" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                          {t("onboarding.recommended")}
                        </span>
                      )}
                      {pace && !tooLate && (
                        <span className="chip" style={{ background: "var(--surface-2)", color: "var(--ink)" }}>
                          {pace.level === "veryTight" ? t("pace.veryTightChip") : t("pace.busyChip")}
                        </span>
                      )}
                      {tooLate && (
                        <span className="chip" style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)", color: "var(--danger)" }}>
                          {t("onboarding.endsAfterExam")}
                        </span>
                      )}
                    </span>
                    <span className="block text-sm" style={{ color: "var(--muted)" }}>
                      {planText(p.months, "bestFor")}
                    </span>
                  </span>
                  <span className="text-end text-sm font-semibold">
                    <span className="block">
                      {t("common.about")}{duration(p.dailyMinutes)}
                      {t("onboarding.perDayShort")}
                    </span>
                    <span className="block" style={{ color: "var(--muted)" }}>
                      {t("onboarding.until", { date: formatDate(end) })}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {chosenPace && (
            <p className="mt-4 rounded-md px-4 py-3 text-sm font-semibold" role="status" style={{ background: "var(--brand-soft)", color: "var(--ink)" }}>
              {t(`pace.${chosenPace.level}`, { n: chosenPace.n })}
            </p>
          )}

          {stageChoices.length > 1 && (
            <div className="card mt-6 p-5">
              <h2 className="font-bold">{t("onboarding.whereStart")}</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {stageChoices.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStartStage(s)}
                    className="rounded-md border-2 px-4 py-2 text-sm font-bold"
                    style={{ borderColor: chosenStage === s ? "var(--brand)" : "var(--line)", background: chosenStage === s ? "var(--brand-soft)" : "transparent" }}
                  >
                    {t("onboarding.stageChoice", { n: s, name: stage(s, "name") })}{" "}
                    {s === recommendedStage
                      ? t("onboarding.choiceRecommended")
                      : s === 1
                        ? t("onboarding.choiceBeginning")
                        : s > recommendedStage
                          ? t("onboarding.choiceHarder")
                          : t("onboarding.choiceGentler")}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button type="button" className="btn btn-primary px-6 py-3" onClick={confirmPlan} disabled={pending}>
              {pending ? t("onboarding.building") : t("onboarding.startJourney")} <Icon name="arrow" size={18} />
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
      <h1 className="font-display text-3xl sm:text-4xl">{title}</h1>
      <p className="mb-8 mt-2" style={{ color: "var(--muted)" }}>
        {subtitle}
      </p>
      {children}
    </section>
  );
}

function Nav({ onNext, nextLabel, ghost = false }: { onNext: () => void; nextLabel?: string; ghost?: boolean }) {
  const { t } = useT();
  return (
    <div className="mt-8 flex justify-end">
      <button type="button" className={`btn ${ghost ? "btn-ghost" : "btn-primary"} px-6 py-3`} onClick={onNext}>
        {nextLabel ?? t("common.continue")} <Icon name="arrow" size={18} />
      </button>
    </div>
  );
}
