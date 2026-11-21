"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { completeMock, type MockCompletion } from "@/app/actions/learn";
import { Celebration } from "@/components/Celebration";
import { ChartView } from "@/components/ChartView";
import { Icon } from "@/components/icons";
import { AudioOnce } from "@/components/mock/AudioOnce";
import { ExamTimer } from "@/components/mock/ExamTimer";
import { QuestionGroupView } from "@/components/mock/QuestionGroupView";
import { QuestionNavigator } from "@/components/mock/QuestionNavigator";
import { requestEvaluation } from "@/components/task/evaluate-client";
import { SpeakingTaskView } from "@/components/task/SpeakingTaskView";
import { wordCount } from "@/components/task/speech";
import { Ring, SKILL_META } from "@/components/ui";
import { answeredNumbers, multiKey, TYPE_LABELS, type MockAnswers, type MockResult } from "@/lib/mock/grade";
import type { FullTest, QuestionGroup } from "@/lib/mock/schema";
import type { SpeakingTask } from "@/content/types";

type Phase = "intro" | "listening" | "listening-check" | "reading" | "writing" | "evaluating-writing" | "speaking" | "submitting" | "results";

interface Saved {
  phase: Phase;
  partIndex: number;
  partStage: "preview" | "playing" | "done";
  listening: MockAnswers;
  reading: MockAnswers;
  flagged: number[];
  checkEndsAt?: number;
  readingEndsAt?: number;
  writingEndsAt?: number;
  essays: { task1: string; task2: string };
  writingIds: { task1?: string; task2?: string };
  speakingIds: { p1?: string; p2?: string; p3?: string };
  speakingPart: number;
}

const fresh = (): Saved => ({
  phase: "intro",
  partIndex: 0,
  partStage: "preview",
  listening: {},
  reading: {},
  flagged: [],
  essays: { task1: "", task2: "" },
  writingIds: {},
  speakingIds: {},
  speakingPart: 0,
});

const MIN = 60_000;

const answeredSet = answeredNumbers;

export function MockTestFlow({ test, storageKey, timeScale }: { test: FullTest; storageKey: string; timeScale: number }) {
  const [st, setSt] = useState<Saved>(fresh);
  const [hasSaved, setHasSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [passage, setPassage] = useState(0);
  const [writingTab, setWritingTab] = useState<"task1" | "task2">("task1");
  const [result, setResult] = useState<MockCompletion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const lGroups = useMemo(() => test.listening.flatMap((p) => p.groups), [test]);
  const rGroups = useMemo(() => test.reading.flatMap((p) => p.groups), [test]);

  // Restore progress after hydration.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const s = JSON.parse(raw) as Saved;
        if (s.phase !== "intro" && s.phase !== "results") setHasSaved(true);
      }
    } catch {}
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded || st.phase === "intro" || st.phase === "results") return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(st));
    } catch {}
  }, [st, loaded, storageKey]);

  const update = useCallback((patch: Partial<Saved> | ((s: Saved) => Partial<Saved>)) => {
    setSt((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));
  }, []);

  const go = (phase: Phase, extra: Partial<Saved> = {}) => {
    update({ phase, ...extra });
    window.scrollTo({ top: 0 });
  };

  function resume() {
    try {
      const s = JSON.parse(localStorage.getItem(storageKey)!) as Saved;
      // A part that was playing can't be resumed mid-recording: move on to the next part.
      if (s.phase === "listening" && s.partStage === "playing") s.partStage = "done";
      if (s.phase === "evaluating-writing") s.phase = "writing";
      if (s.phase === "submitting") s.phase = "speaking";
      setSt(s);
    } catch {
      setSt(fresh());
    }
    setHasSaved(false);
  }

  function startOver() {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    setHasSaved(false);
    go("listening", { ...fresh(), phase: "listening" });
  }

  // ---------- Listening ----------
  const part = test.listening[st.partIndex];
  const nextPart = () => {
    if (st.partIndex < 3) update({ partIndex: st.partIndex + 1, partStage: "preview" });
    else go("listening-check", { checkEndsAt: Date.now() + 2 * MIN * timeScale });
  };

  const toReading = useCallback(() => {
    setPassage(0);
    update({ phase: "reading", readingEndsAt: Date.now() + 60 * MIN * timeScale });
    window.scrollTo({ top: 0 });
  }, [update, timeScale]);

  // ---------- Writing ----------
  const submitWriting = useCallback(async () => {
    update({ phase: "evaluating-writing" });
    setError(null);
    const ids: Saved["writingIds"] = {};
    for (const task of ["task1", "task2"] as const) {
      const text = st.essays[task];
      if (wordCount(text) < 20) continue;
      try {
        const r = await requestEvaluation({ kind: "writing", source: "mock", refId: `${test.id}:${task}`, text });
        ids[task] = r.attemptId;
      } catch (e) {
        setError(`Writing ${task === "task1" ? "Task 1" : "Task 2"}: ${e instanceof Error ? e.message : "evaluation failed"}`);
      }
    }
    update({ phase: "speaking", writingIds: ids, speakingPart: 0 });
    window.scrollTo({ top: 0 });
  }, [st.essays, test.id, update]);

  // ---------- Submit ----------
  async function submitAll() {
    go("submitting");
    const r = await completeMock(test.id, {
      listening: st.listening,
      reading: st.reading,
      writing: st.writingIds,
      speaking: st.speakingIds,
    });
    if (!r.ok) {
      setError(r.error);
      go("speaking");
      return;
    }
    setResult(r);
    setCelebrate(true);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    go("results");
  }

  const speakingTasks: SpeakingTask[] = [
    { part: 1, questions: test.speaking.part1, prepSeconds: 0, speakSeconds: 30 },
    { part: 2, questions: [test.speaking.part2.topic], cueCard: test.speaking.part2, prepSeconds: 60, speakSeconds: 120 },
    { part: 3, questions: test.speaking.part3, prepSeconds: 0, speakSeconds: 60 },
  ];

  const lAnswered = answeredSet(lGroups, st.listening);
  const rAnswered = answeredSet(rGroups, st.reading);
  const flagged = new Set(st.flagged);
  const toggleFlag = (n: number) => update((s) => ({ flagged: s.flagged.includes(n) ? s.flagged.filter((x) => x !== n) : [...s.flagged, n] }));
  const numbers = Array.from({ length: 40 }, (_, i) => i + 1);

  const header = (label: string, right?: React.ReactNode) => (
    <div className="sticky top-0 z-20 -mx-4 mb-5 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10" style={{ borderColor: "var(--line)", background: "color-mix(in srgb, var(--bg) 90%, transparent)" }}>
      <div>
        <div className="eyebrow">{test.title}</div>
        <div className="font-display text-xl font-bold">{label}</div>
      </div>
      {right}
    </div>
  );

  // ================= RENDER =================
  if (st.phase === "intro") {
    return (
      <div className="mx-auto max-w-3xl">
        <Link href="/practice#mock-tests" className="mb-6 inline-flex items-center gap-2 text-sm font-bold" style={{ color: "var(--muted)" }}>
          <Icon name="back" size={16} /> Back
        </Link>
        <div className="card overflow-hidden">
          <div className="p-6 sm:p-8" style={{ background: "linear-gradient(135deg, var(--brand-soft), var(--surface) 70%)" }}>
            <div className="eyebrow">Full IELTS Academic test · about 2 h 45 min</div>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">{test.title}</h1>
            {test.description && <p className="mt-2" style={{ color: "var(--muted)" }}>{test.description}</p>}
            {test.source.attribution && <p className="mt-3 text-xs font-semibold" style={{ color: "var(--muted)" }}>{test.source.attribution}</p>}
          </div>
          <ol className="grid gap-3 p-6 sm:grid-cols-2 sm:p-8">
            {[
              ["listening", "Listening", "4 parts · 40 questions · ~30 min", "Each recording plays once. Read the questions before each part."],
              ["reading", "Reading", "3 passages · 40 questions · 60 min", "No extra time to transfer answers."],
              ["writing", "Writing", "2 tasks · 60 min", "Task 1 ≈ 20 min (150+ words), Task 2 ≈ 40 min (250+ words). Task 2 counts double."],
              ["speaking", "Speaking", "3 parts · 11–14 min", "Recorded answers, AI-estimated band."],
            ].map(([k, t, meta, note], i) => (
              <li key={k} className="rounded-2xl p-4" style={{ background: "var(--surface-2)" }}>
                <div className="flex items-center gap-2">
                  <span className="font-display text-xl font-bold" style={{ color: SKILL_META[k as "reading"].color }}>
                    {i + 1}
                  </span>
                  <Icon name={SKILL_META[k as "reading"].icon} size={18} style={{ color: SKILL_META[k as "reading"].color }} />
                  <span className="font-bold">{t}</span>
                </div>
                <div className="mt-1 text-sm font-semibold">{meta}</div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>{note}</div>
              </li>
            ))}
          </ol>
          <div className="space-y-3 border-t p-6 sm:p-8" style={{ borderColor: "var(--line)" }}>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              Use headphones and a quiet room. Timers keep running if you leave the page, and your answers are saved on this device. Band conversions use the published IELTS tables; real cut-offs vary slightly between test versions.
            </p>
            <div className="flex flex-wrap gap-3">
              {hasSaved && (
                <button type="button" className="btn btn-primary" onClick={resume}>
                  Resume my test <Icon name="arrow" size={18} />
                </button>
              )}
              <button type="button" className={`btn ${hasSaved ? "btn-ghost" : "btn-primary"} px-6 py-3`} onClick={startOver} disabled={!loaded}>
                {hasSaved ? "Start again" : "Start the test"} <Icon name="play" size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (st.phase === "listening") {
    const partGroups = part.groups;
    return (
      <div className="mx-auto max-w-4xl">
        {header(`Listening · Part ${part.part} of 4`, <QuestionNavigator section="listening" numbers={numbers} answered={lAnswered} flagged={flagged} />)}
        <p className="mb-4 font-semibold">{part.context}</p>
        {st.partStage === "preview" && (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl p-4" style={{ background: "var(--surface-2)" }}>
            <Icon name="eye" size={20} />
            <p className="flex-1 text-sm font-semibold">Take a moment to read Questions {partGroups[0].questions[0].n}–{partGroups.at(-1)!.questions.at(-1)!.n}. The recording plays once.</p>
            <button type="button" className="btn btn-primary" style={{ background: "var(--listening)" }} onClick={() => update({ partStage: "playing" })}>
              <Icon name="play" size={16} /> Start Part {part.part}
            </button>
          </div>
        )}
        {st.partStage !== "preview" && (
          <div className="mb-5">
            <AudioOnce key={part.part} part={part} autoStart={st.partStage === "playing"} timeScale={timeScale} onEnded={() => update({ partStage: "done" })} />
          </div>
        )}
        <div className="space-y-4">
          {partGroups.map((g) => (
            <QuestionGroupView key={g.id} section="listening" group={g} answers={st.listening} onChange={(k, v) => update((s) => ({ listening: { ...s.listening, [k]: v } }))} flagged={flagged} onToggleFlag={toggleFlag} />
          ))}
        </div>
        {st.partStage === "done" && (
          <div className="mt-6 flex justify-end">
            <button type="button" className="btn btn-primary" onClick={nextPart}>
              {st.partIndex < 3 ? `Go to Part ${part.part + 1}` : "Check my answers"} <Icon name="arrow" size={18} />
            </button>
          </div>
        )}
      </div>
    );
  }

  if (st.phase === "listening-check") {
    return (
      <div className="mx-auto max-w-4xl">
        {header("Listening · check your answers", <ExamTimer endsAt={st.checkEndsAt!} onExpire={toReading} label="to check" />)}
        <div className="mb-4"><QuestionNavigator section="listening" numbers={numbers} answered={lAnswered} flagged={flagged} /></div>
        <div className="space-y-4">
          {lGroups.map((g) => (
            <QuestionGroupView key={g.id} section="listening" group={g} answers={st.listening} onChange={(k, v) => update((s) => ({ listening: { ...s.listening, [k]: v } }))} flagged={flagged} onToggleFlag={toggleFlag} />
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button type="button" className="btn btn-primary" onClick={toReading}>
            Finish Listening — start Reading <Icon name="arrow" size={18} />
          </button>
        </div>
      </div>
    );
  }

  if (st.phase === "reading") {
    const p = test.reading[passage];
    return (
      <div>
        {header(`Reading · Passage ${passage + 1} of 3`, <ExamTimer endsAt={st.readingEndsAt!} onExpire={() => go("writing", { writingEndsAt: Date.now() + 60 * MIN * timeScale })} label="Reading" />)}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {test.reading.map((r, i) => (
            <button key={r.passage} type="button" onClick={() => setPassage(i)} className="rounded-full px-4 py-1.5 text-sm font-bold" style={{ background: passage === i ? "var(--ink)" : "var(--surface-2)", color: passage === i ? "var(--bg)" : "var(--ink)" }}>
              Passage {r.passage}
            </button>
          ))}
          <div className="ml-auto"><QuestionNavigator section="reading" numbers={numbers} answered={rAnswered} flagged={flagged} onSelect={(n) => setPassage(test.reading.findIndex((r) => r.groups.some((g) => g.questions.some((q) => q.n === n))))} /></div>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <article className="card p-5 lg:sticky lg:top-28 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto sm:p-6">
            <div className="eyebrow">Reading Passage {p.passage}</div>
            <h2 className="mt-1 font-display text-2xl font-bold">{p.title}</h2>
            {p.subtitle && <p className="mb-4 italic" style={{ color: "var(--muted)" }}>{p.subtitle}</p>}
            <div className="space-y-4 text-[15.5px] leading-relaxed">
              {p.paragraphs.map((para, i) => (
                <p key={i}>
                  {para.label && <b className="mr-2">{para.label}</b>}
                  {para.text}
                </p>
              ))}
            </div>
          </article>
          <div className="space-y-4">
            {p.groups.map((g) => (
              <QuestionGroupView key={g.id} section="reading" group={g} answers={st.reading} onChange={(k, v) => update((s) => ({ reading: { ...s.reading, [k]: v } }))} flagged={flagged} onToggleFlag={toggleFlag} />
            ))}
            <div className="flex flex-wrap justify-end gap-3">
              {passage < 2 ? (
                <button type="button" className="btn btn-primary" onClick={() => { setPassage(passage + 1); window.scrollTo({ top: 0 }); }}>
                  Passage {passage + 2} <Icon name="arrow" size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (rAnswered.size < 40 && !window.confirm(`You have answered ${rAnswered.size} of 40 questions. Finish Reading anyway?`)) return;
                    go("writing", { writingEndsAt: Date.now() + 60 * MIN * timeScale });
                  }}
                >
                  Finish Reading — start Writing <Icon name="arrow" size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (st.phase === "writing" || st.phase === "evaluating-writing") {
    const task = test.writing[writingTab];
    const text = st.essays[writingTab];
    const busy = st.phase === "evaluating-writing";
    return (
      <div className="mx-auto max-w-4xl">
        {header("Writing", busy ? <span className="text-sm font-bold">Evaluating…</span> : <ExamTimer endsAt={st.writingEndsAt!} onExpire={submitWriting} label="Writing" />)}
        <div className="mb-4 flex gap-2" role="tablist">
          {(["task1", "task2"] as const).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={writingTab === t} onClick={() => setWritingTab(t)} className="rounded-full px-4 py-1.5 text-sm font-bold" style={{ background: writingTab === t ? "var(--ink)" : "var(--surface-2)", color: writingTab === t ? "var(--bg)" : "var(--ink)" }}>
              {t === "task1" ? "Task 1" : "Task 2"} · {wordCount(st.essays[t])} words
            </button>
          ))}
        </div>
        <div className="card mb-4 p-5">
          <div className="eyebrow mb-2" style={{ color: "var(--writing)" }}>
            {writingTab === "task1" ? "Writing Task 1 · spend about 20 minutes" : "Writing Task 2 · spend about 40 minutes"}
          </div>
          <p className="font-semibold leading-relaxed">{task.prompt}</p>
          {task.chart && <div className="mt-4"><ChartView chart={task.chart} /></div>}
          {task.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={task.image.src} alt={task.image.alt} className="mx-auto mt-4 w-full max-w-xl rounded-xl" />
          )}
        </div>
        <div className="card overflow-hidden">
          <textarea
            value={text}
            onChange={(e) => update((s) => ({ essays: { ...s.essays, [writingTab]: e.target.value } }))}
            disabled={busy}
            aria-label={`Your answer for ${writingTab === "task1" ? "Task 1" : "Task 2"}`}
            placeholder="Write your answer here…"
            spellCheck={false}
            className="block min-h-[360px] w-full resize-y bg-transparent p-4 text-[16px] leading-relaxed outline-none"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4" style={{ borderColor: "var(--line)" }}>
            <span className="text-sm font-semibold" style={{ color: wordCount(text) >= task.minWords ? "var(--success)" : "var(--muted)" }}>
              {wordCount(text)} / {task.minWords} words
            </span>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => {
              if ((wordCount(st.essays.task1) < 20 || wordCount(st.essays.task2) < 20) && !window.confirm("One of your tasks is (almost) empty. Submit Writing anyway?")) return;
              void submitWriting();
            }}>
              {busy ? "The examiner is reading…" : "Submit Writing — go to Speaking"} <Icon name="arrow" size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (st.phase === "speaking" || st.phase === "submitting") {
    const idx = st.speakingPart;
    const key = (["p1", "p2", "p3"] as const)[idx];
    const doneThis = !!st.speakingIds[key];
    return (
      <div className="mx-auto max-w-3xl">
        {header(`Speaking · Part ${idx + 1} of 3`)}
        {error && <p role="alert" className="mb-4 rounded-xl p-3 text-sm font-semibold" style={{ background: "color-mix(in srgb, var(--danger) 10%, transparent)", color: "var(--danger)" }}>{error}</p>}
        <SpeakingTaskView key={idx} task={speakingTasks[idx]} source="mock" refId={`${test.id}:speaking-${idx + 1}`} onEvaluated={(id) => update((s) => ({ speakingIds: { ...s.speakingIds, [key]: id } }))} />
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {idx < 2 ? (
            <button type="button" className={`btn ${doneThis ? "btn-primary" : "btn-ghost"}`} onClick={() => { update({ speakingPart: idx + 1 }); window.scrollTo({ top: 0 }); }}>
              {doneThis ? `Go to Part ${idx + 2}` : `Skip to Part ${idx + 2}`} <Icon name="arrow" size={18} />
            </button>
          ) : (
            <button type="button" className={`btn ${doneThis ? "btn-primary" : "btn-ghost"} px-6 py-3`} onClick={submitAll} disabled={st.phase === "submitting"}>
              {st.phase === "submitting" ? "Calculating your bands…" : doneThis ? "Finish the test" : "Skip & finish the test"} <Icon name="trophy" size={18} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---------- Results ----------
  if (!result) return null;
  const rMap = new Map<number, MockResult>(result.reading.results.map((r) => [r.n, r]));
  const lMap = new Map<number, MockResult>(result.listening.results.map((r) => [r.n, r]));
  const types = Object.entries({ ...mergeTypes(result.listening.byType, result.reading.byType) })
    .map(([t, v]) => ({ t, ...v, pct: v.correct / v.total }))
    .sort((a, b) => a.pct - b.pct);
  const skills = [
    { k: "listening" as const, band: result.listening.band, detail: `${result.listening.raw}/40 correct` },
    { k: "reading" as const, band: result.reading.band, detail: `${result.reading.raw}/40 correct` },
    { k: "writing" as const, band: result.writing.band, detail: `Task 1: ${result.writing.task1?.toFixed(1) ?? "—"} · Task 2: ${result.writing.task2?.toFixed(1) ?? "—"}` },
    { k: "speaking" as const, band: result.speaking.band, detail: result.speaking.parts.filter((b) => b !== null).length ? `${result.speaking.parts.filter((b) => b !== null).length}/3 parts assessed` : "Not taken" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="card p-6 text-center sm:p-8">
        <div className="eyebrow">{test.title} · Results</div>
        <h1 className="mt-2 font-display text-5xl font-bold">Band {result.overall?.toFixed(1) ?? "—"}</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm" style={{ color: "var(--muted)" }}>
          Estimated overall band{result.speaking.band === null || result.writing.band === null ? " from the sections you completed" : ""}. Listening and Reading use the published IELTS conversion tables; Writing and Speaking are AI estimates.
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {skills.map((s) => (
            <div key={s.k} className="flex flex-col items-center">
              <Ring value={(s.band ?? 0) / 9} size={90} stroke={8} color={SKILL_META[s.k].color} label={`${SKILL_META[s.k].label} ${s.band ?? "not assessed"}`}>
                <span className="font-display text-xl font-bold">{s.band?.toFixed(1) ?? "—"}</span>
              </Ring>
              <span className="mt-2 text-sm font-bold">{SKILL_META[s.k].label}</span>
              <span className="text-xs" style={{ color: "var(--muted)" }}>{s.detail}</span>
            </div>
          ))}
        </div>
      </div>

      <section className="card p-5 sm:p-6">
        <h2 className="mb-4 font-display text-xl font-bold">Accuracy by question type</h2>
        <ul className="space-y-2.5">
          {types.map((x) => (
            <li key={x.t} className="flex items-center gap-3 text-sm">
              <span className="w-56 shrink-0 font-semibold">{TYPE_LABELS[x.t as keyof typeof TYPE_LABELS]}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
                <div className="h-full rounded-full" style={{ width: `${x.pct * 100}%`, background: x.pct >= 0.75 ? "var(--success)" : x.pct >= 0.5 ? "var(--writing)" : "var(--danger)" }} />
              </div>
              <span className="w-12 text-right font-bold">{x.correct}/{x.total}</span>
            </li>
          ))}
        </ul>
        {types[0] && types[0].pct < 0.75 && (
          <p className="mt-4 rounded-xl p-3 text-sm" style={{ background: "var(--surface-2)" }}>
            <b>Focus next:</b> {TYPE_LABELS[types[0].t as keyof typeof TYPE_LABELS]} — your lowest accuracy in this test.
          </p>
        )}
      </section>

      <details className="card p-5">
        <summary className="cursor-pointer font-bold">Review Listening answers ({result.listening.raw}/40)</summary>
        <div className="mt-4 space-y-4">
          {lGroups.map((g) => <QuestionGroupView key={g.id} section="listening" group={g} answers={st.listening} onChange={() => {}} results={lMap} />)}
        </div>
      </details>
      <details className="card p-5">
        <summary className="cursor-pointer font-bold">Review Reading answers ({result.reading.raw}/40)</summary>
        <div className="mt-4 space-y-4">
          {rGroups.map((g) => <QuestionGroupView key={g.id} section="reading" group={g} answers={st.reading} onChange={() => {}} results={rMap} />)}
        </div>
      </details>

      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/progress" className="btn btn-primary">See my progress</Link>
        <Link href="/practice" className="btn btn-ghost">Back to practice</Link>
      </div>

      {celebrate && (
        <Celebration big title="Mock test complete!" subtitle="Your results have been added to your progress." band={result.overall} xp={result.activity.xpGained} streak={result.activity.streak} streakExtended={result.activity.streakExtended} nextHref="/progress" nextTitle="See my progress" onClose={() => setCelebrate(false)} />
      )}
    </div>
  );
}

function mergeTypes(...parts: Partial<Record<string, { correct: number; total: number }>>[]) {
  const out: Record<string, { correct: number; total: number }> = {};
  for (const p of parts)
    for (const [k, v] of Object.entries(p)) {
      if (!v) continue;
      out[k] = { correct: (out[k]?.correct ?? 0) + v.correct, total: (out[k]?.total ?? 0) + v.total };
    }
  return out;
}
