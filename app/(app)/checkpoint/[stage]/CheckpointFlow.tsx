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

const ORDER: Skill[] = ["listening", "reading", "writing", "speaking"];

export function CheckpointFlow({ checkpoint, stageName, passBand, isFinal }: { checkpoint: Checkpoint; stageName: string; passBand: number; isFinal: boolean }) {
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
        <Link href="/journey" className="grid h-10 w-10 place-items-center rounded-full" style={{ background: "var(--surface-2)" }} aria-label="Back to journey">
          <Icon name="back" size={18} />
        </Link>
        <div className="flex-1">
          <div className="eyebrow">
            Stage {checkpoint.stage} · {stageName}
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
          <h1 className="mt-4 font-display text-3xl font-bold">{checkpoint.title}</h1>
          <p className="mt-2" style={{ color: "var(--muted)" }}>
            A mini exam across all four skills, about 60 minutes. Reach an overall Band {passBand.toFixed(1)} to {isFinal ? "reach the summit" : "unlock the next stage"}. You can retake it any time.
          </p>
          <ol className="mt-6 grid gap-2 sm:grid-cols-2">
            {ORDER.map((s, i) => (
              <li key={s} className="flex items-center gap-3 rounded-md p-3" style={{ background: "var(--surface-2)" }}>
                <span className="font-display font-bold" style={{ color: SKILL_META[s].color }}>
                  {i + 1}
                </span>
                <Icon name={SKILL_META[s].icon} size={18} style={{ color: SKILL_META[s].color }} />
                <span className="font-semibold">{SKILL_META[s].label}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
            Tip: find a quiet place with a microphone. Treat it like the real exam — no dictionary, no pauses.
          </p>
          <button type="button" className="btn btn-primary mt-6 px-6 py-3" onClick={() => go(0)}>
            Begin <Icon name="arrow" size={18} />
          </button>
        </section>
      )}

      {skill === "listening" && (
        <section className="animate-rise space-y-6">
          <h1 className="font-display text-3xl font-bold">Listening</h1>
          <ListeningPlayer task={checkpoint.listening} revealScript={false} />
          <TaskQuestions task={checkpoint.listening} section="listening" answers={listening} onChange={(id, v) => setListening((a) => ({ ...a, [id]: v }))} accent="var(--listening)" />
          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={() => go(1)}>
              Next: Reading <Icon name="arrow" size={18} />
            </button>
          </div>
        </section>
      )}

      {skill === "reading" && (
        <section className="animate-rise space-y-6">
          <h1 className="font-display text-3xl font-bold">Reading · {checkpoint.reading.timeMinutes} minutes</h1>
          <article className="card prose-reading p-6 text-[16px]">
            <h2 className="mb-3 font-display text-2xl font-bold">{checkpoint.reading.title}</h2>
            {checkpoint.reading.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </article>
          <TaskQuestions task={checkpoint.reading} section="reading" answers={reading} onChange={(id, v) => setReading((a) => ({ ...a, [id]: v }))} accent="var(--reading)" />
          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={() => go(2)}>
              Next: Writing <Icon name="arrow" size={18} />
            </button>
          </div>
        </section>
      )}

      {skill === "writing" && (
        <section className="animate-rise space-y-6">
          <h1 className="font-display text-3xl font-bold">Writing</h1>
          <WritingTaskView task={checkpoint.writing} source="checkpoint" refId={checkpoint.id} onEvaluated={(id) => setWritingId(id)} compact />
          <div className="flex justify-end">
            <button className="btn btn-primary" onClick={() => go(3)} disabled={!writingId}>
              Next: Speaking <Icon name="arrow" size={18} />
            </button>
          </div>
        </section>
      )}

      {skill === "speaking" && (
        <section className="animate-rise space-y-6">
          <h1 className="font-display text-3xl font-bold">Speaking</h1>
          <SpeakingTaskView task={checkpoint.speaking} source="checkpoint" refId={checkpoint.id} onEvaluated={(id) => setSpeakingId(id)} />
          {error && (
            <p role="alert" className="font-semibold" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
          <div className="flex justify-end">
            <button className="btn btn-primary px-6 py-3" onClick={submit} disabled={!speakingId || pending}>
              {pending ? "Calculating…" : "Finish & see my result"} <Icon name="trophy" size={18} />
            </button>
          </div>
        </section>
      )}

      {idx === 4 && result && (
        <section className="animate-rise space-y-6">
          <div className="card p-6 text-center sm:p-8">
            <div className="eyebrow">{result.passed ? "Checkpoint passed" : "Not quite yet"}</div>
            <h1 className="mt-2 font-display text-5xl font-bold">Band {result.overall.toFixed(1)}</h1>
            <p className="mx-auto mt-2 max-w-md" style={{ color: "var(--muted)" }}>
              {result.passed
                ? result.unlockedStage
                  ? `You unlocked Stage ${result.unlockedStage}. The next camp is waiting.`
                  : isFinal
                    ? "You've reached the summit. You're ready for exam day."
                    : "Great consolidation of your skills."
                : `You need Band ${result.passBand.toFixed(1)} to pass. Review your weakest skill below, practise a little more, and try again — every attempt makes you stronger.`}
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {ORDER.map((s) => (
                <div key={s} className="flex flex-col items-center">
                  <Ring value={result.bands[s] / 9} size={86} stroke={8} color={SKILL_META[s].color} label={`${SKILL_META[s].label} ${result.bands[s]}`}>
                    <span className="font-display text-xl font-bold">{result.bands[s].toFixed(1)}</span>
                  </Ring>
                  <span className="mt-2 text-sm font-bold">{SKILL_META[s].label}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/journey" className="btn btn-primary">
                Back to the journey
              </Link>
              {!result.passed && (
                <Link href="/practice" className="btn btn-ghost">
                  Practise more
                </Link>
              )}
            </div>
          </div>
          <details className="card p-5">
            <summary className="cursor-pointer font-bold">Review Listening answers ({result.listening.correct}/{result.listening.total})</summary>
            <div className="mt-4">
              <TaskQuestions task={checkpoint.listening} section="listening" answers={listening} onChange={() => {}} results={result.listening.results} groupResults={result.listening.groupResults} accent="var(--listening)" />
            </div>
          </details>
          <details className="card p-5">
            <summary className="cursor-pointer font-bold">Review Reading answers ({result.reading.correct}/{result.reading.total})</summary>
            <div className="mt-4">
              <TaskQuestions task={checkpoint.reading} section="reading" answers={reading} onChange={() => {}} results={result.reading.results} groupResults={result.reading.groupResults} accent="var(--reading)" />
            </div>
          </details>
        </section>
      )}

      {celebrate && result && (
        <Celebration
          big
          title={isFinal ? "Summit reached!" : "Camp reached!"}
          subtitle={result.unlockedStage ? `Stage ${result.unlockedStage} is now unlocked.` : `Overall Band ${result.overall.toFixed(1)}`}
          band={result.overall}
          xp={result.activity.xpGained}
          streak={result.activity.streak}
          streakExtended={result.activity.streakExtended}
          freezeEarned={result.activity.freezeEarned}
          nextHref="/journey"
          nextTitle="See the map"
          onClose={() => setCelebrate(false)}
        />
      )}
    </div>
  );
}
