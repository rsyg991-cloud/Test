"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { completeCheckpoint, type CheckpointResult } from "@/app/actions/learn";
import type { Checkpoint, Skill } from "@/content/types";
import { Celebration } from "@/components/Celebration";
import { Icon } from "@/components/icons";
import { ListeningPlayer } from "@/components/task/ListeningPlayer";
import { TaskQuestions } from "@/components/task/TaskQuestions";
import { SpeakingTaskView } from "@/components/task/SpeakingTaskView";
import { WritingTaskView } from "@/components/task/WritingTaskView";
import { Ring, SKILL_META } from "@/components/ui";
import type { Answers } from "@/lib/scoring";
import { useT } from "@/lib/i18n/client";

const ORDER: Skill[] = ["listening", "reading", "writing", "speaking"];

export function CheckpointFlow({ checkpoint, stageName, passBand, isFinal }: { checkpoint: Checkpoint; stageName: string; passBand: number; isFinal: boolean }) {
  const { t, stage } = useT();
  const [idx, setIdx] = useState(-1);
  const [reading, setReading] = useState<Answers>({});
  const [listening, setListening] = useState<Answers>({});
  const [writingId, setWritingId] = useState<string>();
  const [speakingId, setSpeakingId] = useState<string>();
  const [result, setResult] = useState<CheckpointResult | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const skill = ORDER[idx];

  const go = (i: number) => {
    setIdx(i);
    window.scrollTo({ top: 0 });
  };

  function submit() {
    setError(null);
    start(async () => {
      const r = await completeCheckpoint(checkpoint.stage, { reading, listening, writingAttemptId: writingId, speakingAttemptId: speakingId });
      if (!r.ok) return setError(r.error);
      setResult(r);
      setCelebrate(r.passed);
      go(4);
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/journey" className="grid h-10 w-10 place-items-center rounded-full" style={{ background: "var(--surface-2)" }} aria-label={t("lesson.backAria")}>
          <Icon name="back" size={18} />
        </Link>
        <div className="flex-1">
          <div className="eyebrow">
            {t("checkpoint.header", { n: checkpoint.stage, stage: stageName })}
          </div>
          <div className="mt-1 flex gap-1.5">
            {ORDER.map((s, i) => (
              <span key={s} className="h-1.5 flex-1 rounded-full" style={{ background: i <= idx ? SKILL_META[s].color : "var(--surface-2)" }} />
            ))}
          </div>
        </div>
      </div>

      {idx === -1 && (
        <section className="animate-rise card p-6 sm:p-8">
          <span className="grid h-14 w-14 place-items-center rounded-[10px] text-white" style={{ background: "var(--navy)" }}>
            <Icon name="trophy" size={26} />
          </span>
          <h1 className="mt-4 font-display text-3xl">{t("checkpoint.title", { camp: stage(checkpoint.stage, "camp") })}</h1>
          <p className="mt-2" style={{ color: "var(--muted)" }}>
            {t(isFinal ? "checkpoint.introFinal" : "checkpoint.intro", { band: passBand.toFixed(1) })}
          </p>
          <ol className="mt-6 grid gap-2 sm:grid-cols-2">
            {ORDER.map((s, i) => (
              <li key={s} className="flex items-center gap-3 rounded-md p-3" style={{ background: "var(--surface-2)" }}>
                <span className="num font-bold" style={{ color: SKILL_META[s].color }}>
                  {i + 1}
                </span>
                <Icon name={SKILL_META[s].icon} size={18} style={{ color: SKILL_META[s].color }} />
                <span className="font-semibold">{t(`skills.${s}`)}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
            {t("checkpoint.tip")}
          </p>
          <button type="button" className="btn btn-primary mt-6 px-6 py-3" onClick={() => go(0)}>
            {t("checkpoint.begin")} <Icon name="arrow" size={18} />
          </button>
        </section>
      )}

      {skill === "listening" && (
        <section className="animate-rise space-y-6">
          <h1 className="font-display text-3xl">{t("skills.listening")}</h1>
          <ListeningPlayer task={checkpoint.listening} revealScript={false} />
          <TaskQuestions task={checkpoint.listening} section="listening" answers={listening} onChange={(id, v) => setListening((a) => ({ ...a, [id]: v }))} accent="var(--listening)" />
          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={() => go(1)}>
              {t("checkpoint.next", { skill: t("skills.reading") })} <Icon name="arrow" size={18} />
            </button>
          </div>
        </section>
      )}

      {skill === "reading" && (
        <section className="animate-rise space-y-6">
          <h1 className="font-display text-3xl">{t("checkpoint.readingTitle", { minutes: checkpoint.reading.timeMinutes })}</h1>
          <article className="card prose-reading p-6 text-[16px]" lang="en" dir="ltr">
            <h2 className="mb-3 font-display text-2xl">{checkpoint.reading.title}</h2>
            {checkpoint.reading.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </article>
          <TaskQuestions task={checkpoint.reading} section="reading" answers={reading} onChange={(id, v) => setReading((a) => ({ ...a, [id]: v }))} accent="var(--reading)" />
          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={() => go(2)}>
              {t("checkpoint.next", { skill: t("skills.writing") })} <Icon name="arrow" size={18} />
            </button>
          </div>
        </section>
      )}

      {skill === "writing" && (
        <section className="animate-rise space-y-6">
          <h1 className="font-display text-3xl">{t("skills.writing")}</h1>
          <WritingTaskView task={checkpoint.writing} source="checkpoint" refId={checkpoint.id} onEvaluated={(id) => setWritingId(id)} compact />
          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={() => go(3)} disabled={!writingId}>
              {t("checkpoint.next", { skill: t("skills.speaking") })} <Icon name="arrow" size={18} />
            </button>
          </div>
        </section>
      )}

      {skill === "speaking" && (
        <section className="animate-rise space-y-6">
          <h1 className="font-display text-3xl">{t("skills.speaking")}</h1>
          <SpeakingTaskView task={checkpoint.speaking} source="checkpoint" refId={checkpoint.id} onEvaluated={(id) => setSpeakingId(id)} />
          {error && (
            <p role="alert" className="font-semibold" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
          <div className="flex justify-end">
            <button className="btn btn-primary px-6 py-3" onClick={submit} disabled={!speakingId || pending}>
              {pending ? t("checkpoint.calculating") : t("checkpoint.finish")} <Icon name="trophy" size={18} />
            </button>
          </div>
        </section>
      )}

      {idx === 4 && result && (
        <section className="animate-rise space-y-6">
          <div className="card p-6 text-center sm:p-8">
            <div className="eyebrow">{result.passed ? t("checkpoint.passed") : t("checkpoint.notYet")}</div>
            <h1 className="mt-2 font-display text-5xl" dir="ltr">
              Band <span className="num">{result.overall.toFixed(1)}</span>
            </h1>
            <p className="mx-auto mt-2 max-w-md" style={{ color: "var(--muted)" }}>
              {result.passed
                ? result.unlockedStage
                  ? t("checkpoint.unlocked", { n: result.unlockedStage })
                  : result.fullWritingNeeded
                    ? t("starter.fullWritingNeeded", { n: result.fullWritingNeeded })
                    : isFinal
                    ? t("checkpoint.summit")
                    : t("checkpoint.consolidated")
                : t("checkpoint.needBand", { band: result.passBand.toFixed(1) })}
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {ORDER.map((s) => (
                <div key={s} className="flex flex-col items-center">
                  <Ring value={result.bands[s] / 9} size={86} stroke={8} color={SKILL_META[s].color} label={`${t(`skills.${s}`)} ${result.bands[s]}`}>
                    <span className="num text-xl font-bold">{result.bands[s].toFixed(1)}</span>
                  </Ring>
                  <span className="mt-2 text-sm font-bold">{t(`skills.${s}`)}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/journey" className="btn btn-primary">
                {t("lesson.backToJourney")}
              </Link>
              {!result.passed && (
                <Link href="/practice" className="btn btn-ghost">
                  {t("checkpoint.practiseMore")}
                </Link>
              )}
            </div>
          </div>
          <details className="card p-5">
            <summary className="cursor-pointer font-bold">{t("checkpoint.reviewListening", { correct: result.listening.correct ?? 0, total: result.listening.total ?? 0 })}</summary>
            <div className="mt-4">
              <TaskQuestions task={checkpoint.listening} section="listening" answers={listening} onChange={() => {}} results={result.listening.results} groupResults={result.listening.groupResults} accent="var(--listening)" />
            </div>
          </details>
          <details className="card p-5">
            <summary className="cursor-pointer font-bold">{t("checkpoint.reviewReading", { correct: result.reading.correct ?? 0, total: result.reading.total ?? 0 })}</summary>
            <div className="mt-4">
              <TaskQuestions task={checkpoint.reading} section="reading" answers={reading} onChange={() => {}} results={result.reading.results} groupResults={result.reading.groupResults} accent="var(--reading)" />
            </div>
          </details>
        </section>
      )}

      {celebrate && result && (
        <Celebration
          big
          title={isFinal ? t("checkpoint.summitReached") : t("checkpoint.campReached")}
          subtitle={result.unlockedStage ? t("checkpoint.nowUnlocked", { n: result.unlockedStage }) : t("checkpoint.overallBand", { band: result.overall.toFixed(1) })}
          band={result.overall}
          xp={result.activity.xpGained}
          streak={result.activity.streak}
          streakExtended={result.activity.streakExtended}
          freezeEarned={result.activity.freezeEarned}
          nextHref="/journey"
          nextTitle={t("checkpoint.seeMap")}
          onClose={() => setCelebrate(false)}
        />
      )}
    </div>
  );
}
