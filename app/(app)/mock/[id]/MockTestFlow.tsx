"use client";

import { useT } from "@/lib/i18n/client";
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
  const { t } = useT();
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
        <div className="eyebrow" dir="auto">
          {test.title}
        </div>
        <div className="font-display text-xl">{label}</div>
      </div>
      {right}
    </div>
  );

  // ================= RENDER =================
  if (st.phase === "intro") {
    return (
      <div className="mx-auto max-w-3xl">
        <Link href="/practice#mock-tests" className="mb-6 inline-flex items-center gap-2 text-sm font-bold" style={{ color: "var(--muted)" }}>
          <Icon name="back" size={16} /> {t("mock.back")}
        </Link>
        <div className="card overflow-hidden">
          <div className="p-6 sm:p-8" style={{ background: "var(--brand-soft)" }}>
            <div className="eyebrow">{t("mock.eyebrow")}</div>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl" lang="en" dir="auto">
              {test.title}
            </h1>
            {test.description && (
              <p className="mt-2" style={{ color: "var(--muted)" }} lang="en" dir="ltr">
                {test.description}
              </p>
            )}
            {test.source.attribution && <p className="mt-3 text-xs font-semibold" style={{ color: "var(--muted)" }}>{test.source.attribution}</p>}
          </div>
          <ol className="grid gap-3 p-6 sm:grid-cols-2 sm:p-8">
            {(["listening", "reading", "writing", "speaking"] as const).map((k, i) => (
              <li key={k} className="rounded-[10px] p-4" style={{ background: "var(--surface-2)" }}>
                <div className="flex items-center gap-2">
                  <span className="num text-xl font-bold" style={{ color: SKILL_META[k].color }}>
                    {i + 1}
                  </span>
                  <Icon name={SKILL_META[k].icon} size={18} style={{ color: SKILL_META[k].color }} />
                  <span className="font-bold">{t(`skills.${k}`)}</span>
                </div>
                <div className="mt-1 text-sm font-semibold">{t(`mock.sections.${k}.meta`)}</div>
                <div className="text-sm" style={{ color: "var(--muted)" }}>
                  {t(`mock.sections.${k}.note`)}
                </div>
              </li>
            ))}
          </ol>
          <div className="space-y-3 border-t p-6 sm:p-8" style={{ borderColor: "var(--line)" }}>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {t("mock.advice")}
            </p>
            <div className="flex flex-wrap gap-3">
              {hasSaved && (
                <button type="button" className="btn btn-primary" onClick={resume}>
                  {t("mock.resume")} <Icon name="arrow" size={18} />
                </button>
              )}
              <button type="button" className={`btn ${hasSaved ? "btn-ghost" : "btn-primary"} px-6 py-3`} onClick={startOver} disabled={!loaded}>
                {hasSaved ? t("mock.startAgain") : t("mock.start")} <Icon name="play" size={16} />
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
        {header(t("mock.listeningPart", { n: part.part }), <QuestionNavigator section="listening" numbers={numbers} answered={lAnswered} flagged={flagged} />)}
        <p className="mb-4 font-semibold" lang="en" dir="ltr">
          {part.context}
        </p>
        {st.partStage === "preview" && (
          <div className="mb-5 flex flex-wrap items-center gap-3 rounded-[10px] p-4" style={{ background: "var(--surface-2)" }}>
            <Icon name="eye" size={20} />
            <p className="flex-1 text-sm font-semibold">{t("mock.preview", { from: partGroups[0].questions[0].n, to: partGroups.at(-1)!.questions.at(-1)!.n })}</p>
            <button type="button" className="btn btn-primary" onClick={() => update({ partStage: "playing" })}>
              <Icon name="play" size={16} /> {t("mock.startPart", { n: part.part })}
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
              {st.partIndex < 3 ? t("mock.goToPart", { n: part.part + 1 }) : t("mock.checkMine")} <Icon name="arrow" size={18} />
            </button>
          </div>
        )}
      </div>
    );
  }

  if (st.phase === "listening-check") {
    return (
      <div className="mx-auto max-w-4xl">
        {header(t("mock.listeningCheck"), <ExamTimer endsAt={st.checkEndsAt!} onExpire={toReading} label={t("mock.toCheck")} />)}
        <div className="mb-4"><QuestionNavigator section="listening" numbers={numbers} answered={lAnswered} flagged={flagged} /></div>
        <div className="space-y-4">
          {lGroups.map((g) => (
            <QuestionGroupView key={g.id} section="listening" group={g} answers={st.listening} onChange={(k, v) => update((s) => ({ listening: { ...s.listening, [k]: v } }))} flagged={flagged} onToggleFlag={toggleFlag} />
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button type="button" className="btn btn-primary" onClick={toReading}>
            {t("mock.finishListening")} <Icon name="arrow" size={18} />
          </button>
        </div>
      </div>
    );
  }

  if (st.phase === "reading") {
    const p = test.reading[passage];
    return (
      <div>
        {header(t("mock.readingPassage", { n: passage + 1 }), <ExamTimer endsAt={st.readingEndsAt!} onExpire={() => go("writing", { writingEndsAt: Date.now() + 60 * MIN * timeScale })} label={t("skills.reading")} />)}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {test.reading.map((r, i) => (
            <button key={r.passage} type="button" onClick={() => setPassage(i)} className="rounded-full px-4 py-1.5 text-sm font-bold" style={{ background: passage === i ? "var(--ink)" : "var(--surface-2)", color: passage === i ? "var(--bg)" : "var(--ink)" }}>
              {t("mock.passage", { n: r.passage })}
            </button>
          ))}
          <div className="ms-auto"><QuestionNavigator section="reading" numbers={numbers} answered={rAnswered} flagged={flagged} onSelect={(n) => setPassage(test.reading.findIndex((r) => r.groups.some((g) => g.questions.some((q) => q.n === n))))} /></div>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <article className="card p-5 lg:sticky lg:top-28 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto sm:p-6" lang="en" dir="ltr">
            <div className="eyebrow">Reading Passage {p.passage}</div>
            <h2 className="mt-1 font-display text-2xl">{p.title}</h2>
            {p.subtitle && <p className="mb-4 italic" style={{ color: "var(--muted)" }}>{p.subtitle}</p>}
            <div className="space-y-4 text-[15.5px] leading-relaxed">
              {p.paragraphs.map((para, i) => (
                <p key={i}>
                  {para.label && <b className="me-2">{para.label}</b>}
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
                  {t("mock.passage", { n: passage + 2 })} <Icon name="arrow" size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (rAnswered.size < 40 && !window.confirm(t("mock.finishReadingConfirm", { n: rAnswered.size }))) return;
                    go("writing", { writingEndsAt: Date.now() + 60 * MIN * timeScale });
                  }}
                >
                  {t("mock.finishReading")} <Icon name="arrow" size={18} />
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
        {header(t("mock.writing"), busy ? <span className="text-sm font-bold">{t("mock.evaluating")}</span> : <ExamTimer endsAt={st.writingEndsAt!} onExpire={submitWriting} label={t("skills.writing")} />)}
        <div className="mb-4 flex gap-2" role="tablist">
          {(["task1", "task2"] as const).map((tk) => (
            <button key={tk} type="button" role="tab" aria-selected={writingTab === tk} onClick={() => setWritingTab(tk)} className="rounded-full px-4 py-1.5 text-sm font-bold" style={{ background: writingTab === tk ? "var(--ink)" : "var(--surface-2)", color: writingTab === tk ? "var(--bg)" : "var(--ink)" }}>
              {t("mock.taskTab", { n: tk === "task1" ? 1 : 2, words: wordCount(st.essays[tk]) })}
            </button>
          ))}
        </div>
        <div className="card mb-4 p-5">
          <div className="eyebrow mb-2" style={{ color: "var(--writing)" }}>
            {writingTab === "task1" ? t("mock.task1Hint") : t("mock.task2Hint")}
          </div>
          <p className="font-semibold leading-relaxed" lang="en" dir="ltr">
            {task.prompt}
          </p>
          {task.chart && <div className="mt-4"><ChartView chart={task.chart} /></div>}
          {task.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={task.image.src} alt={task.image.alt} className="mx-auto mt-4 w-full max-w-xl rounded-md" />
          )}
        </div>
        <div className="card overflow-hidden">
          <textarea
            value={text}
            onChange={(e) => update((s) => ({ essays: { ...s.essays, [writingTab]: e.target.value } }))}
            disabled={busy}
            aria-label={t("mock.answerFor", { n: writingTab === "task1" ? 1 : 2 })}
            placeholder={t("mock.placeholder")}
            lang="en"
            dir="ltr"
            spellCheck={false}
            className="block min-h-[360px] w-full resize-y bg-transparent p-4 text-[16px] leading-relaxed outline-none"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4" style={{ borderColor: "var(--line)" }}>
            <span className="text-sm font-semibold" style={{ color: wordCount(text) >= task.minWords ? "var(--success)" : "var(--muted)" }}>
              {t("mock.words", { words: wordCount(text), min: task.minWords })}
            </span>
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => {
              if ((wordCount(st.essays.task1) < 20 || wordCount(st.essays.task2) < 20) && !window.confirm(t("mock.emptyConfirm"))) return;
              void submitWriting();
            }}>
              {busy ? t("mock.examinerReading") : t("mock.submitWriting")} <Icon name="arrow" size={18} />
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
        {header(t("mock.speakingPart", { n: idx + 1 }))}
        {error && <p role="alert" className="mb-4 rounded-md p-3 text-sm font-semibold" style={{ background: "color-mix(in srgb, var(--danger) 10%, transparent)", color: "var(--danger)" }}>{error}</p>}
        <SpeakingTaskView key={idx} task={speakingTasks[idx]} source="mock" refId={`${test.id}:speaking-${idx + 1}`} onEvaluated={(id) => update((s) => ({ speakingIds: { ...s.speakingIds, [key]: id } }))} />
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {idx < 2 ? (
            <button type="button" className={`btn ${doneThis ? "btn-primary" : "btn-ghost"}`} onClick={() => { update({ speakingPart: idx + 1 }); window.scrollTo({ top: 0 }); }}>
              {doneThis ? t("mock.goToPart", { n: idx + 2 }) : t("mock.skipToPart", { n: idx + 2 })} <Icon name="arrow" size={18} />
            </button>
          ) : (
            <button type="button" className={`btn ${doneThis ? "btn-primary" : "btn-ghost"} px-6 py-3`} onClick={submitAll} disabled={st.phase === "submitting"}>
              {st.phase === "submitting" ? t("mock.calculating") : doneThis ? t("mock.finish") : t("mock.skipFinish")} <Icon name="trophy" size={18} />
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
    .map(([type, v]) => ({ type, ...v, pct: v.correct / v.total }))
    .sort((a, b) => a.pct - b.pct);
  const skills = [
    { k: "listening" as const, band: result.listening.band, detail: t("mock.correct40", { n: result.listening.raw }) },
    { k: "reading" as const, band: result.reading.band, detail: t("mock.correct40", { n: result.reading.raw }) },
    { k: "writing" as const, band: result.writing.band, detail: t("mock.writingDetail", { t1: result.writing.task1?.toFixed(1) ?? "—", t2: result.writing.task2?.toFixed(1) ?? "—" }) },
    {
      k: "speaking" as const,
      band: result.speaking.band,
      detail: result.speaking.parts.filter((b) => b !== null).length ? t("mock.partsAssessed", { n: result.speaking.parts.filter((b) => b !== null).length }) : t("mock.notTaken"),
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="card p-6 text-center sm:p-8">
        <div className="eyebrow">{t("mock.results", { title: test.title })}</div>
        <h1 className="mt-2 font-display text-5xl" dir="ltr">
          Band <span className="num">{result.overall?.toFixed(1) ?? "—"}</span>
        </h1>
        <p className="mx-auto mt-2 max-w-lg text-sm" style={{ color: "var(--muted)" }}>
          {result.speaking.band === null || result.writing.band === null ? t("mock.estimatedPartial") : t("mock.estimated")}
        </p>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {skills.map((s) => (
            <div key={s.k} className="flex flex-col items-center">
              <Ring value={(s.band ?? 0) / 9} size={90} stroke={8} color={SKILL_META[s.k].color} label={`${t(`skills.${s.k}`)} ${s.band ?? t("mock.notAssessed")}`}>
                <span className="num text-xl font-bold">{s.band?.toFixed(1) ?? "—"}</span>
              </Ring>
              <span className="mt-2 text-sm font-bold">{t(`skills.${s.k}`)}</span>
              <span className="text-xs" style={{ color: "var(--muted)" }}>{s.detail}</span>
            </div>
          ))}
        </div>
      </div>

      <section className="card p-5 sm:p-6">
        <h2 className="mb-4 font-display text-xl">{t("mock.accuracy")}</h2>
        <ul className="space-y-2.5">
          {types.map((x) => (
            <li key={x.type} className="flex items-center gap-3 text-sm">
              <span className="w-56 shrink-0 font-semibold" lang="en" dir="ltr">
                {TYPE_LABELS[x.type as keyof typeof TYPE_LABELS]}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
                <div className="h-full rounded-full" style={{ width: `${x.pct * 100}%`, background: x.pct >= 0.75 ? "var(--success)" : x.pct >= 0.5 ? "var(--writing)" : "var(--danger)" }} />
              </div>
              <span className="num w-12 text-end font-bold" dir="ltr">
                {x.correct}/{x.total}
              </span>
            </li>
          ))}
        </ul>
        {types[0] && types[0].pct < 0.75 && (
          <p className="mt-4 rounded-md p-3 text-sm" style={{ background: "var(--surface-2)" }}>
            <b>{t("mock.focusNext")}</b> {t("mock.focusNextBody", { type: TYPE_LABELS[types[0].type as keyof typeof TYPE_LABELS] })}
          </p>
        )}
      </section>

      <details className="card p-5">
        <summary className="cursor-pointer font-bold">{t("mock.reviewListening", { n: result.listening.raw })}</summary>
        <div className="mt-4 space-y-4">
          {lGroups.map((g) => <QuestionGroupView key={g.id} section="listening" group={g} answers={st.listening} onChange={() => {}} results={lMap} />)}
        </div>
      </details>
      <details className="card p-5">
        <summary className="cursor-pointer font-bold">{t("mock.reviewReading", { n: result.reading.raw })}</summary>
        <div className="mt-4 space-y-4">
          {rGroups.map((g) => <QuestionGroupView key={g.id} section="reading" group={g} answers={st.reading} onChange={() => {}} results={rMap} />)}
        </div>
      </details>

      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/progress" className="btn btn-primary">
          {t("mock.seeProgress")}
        </Link>
        <Link href="/practice" className="btn btn-ghost">
          {t("mock.backToPractice")}
        </Link>
      </div>

      {celebrate && (
        <Celebration
          big
          title={t("mock.complete")}
          subtitle={t("mock.completeBody")}
          band={result.overall}
          xp={result.activity.xpGained}
          streak={result.activity.streak}
          streakExtended={result.activity.streakExtended}
          nextHref="/progress"
          nextTitle={t("mock.seeProgress")}
          onClose={() => setCelebrate(false)}
        />
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
