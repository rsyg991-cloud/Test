"use client";

import { useEffect, useRef, useState } from "react";
import type { SpeakingTask } from "@/content/types";
import type { Evaluation } from "@/lib/ai/schema";
import { Icon } from "../icons";
import { requestEvaluation, type EvalSource } from "./evaluate-client";
import { FeedbackCard } from "./FeedbackCard";
import { createRecognition, fmtTime, speak, ttsSupported, wordCount, type RecognitionLike } from "./speech";

type Phase = "idle" | "prep" | "recording" | "review";

export function SpeakingTaskView({
  task,
  source,
  refId,
  onEvaluated,
}: {
  task: SpeakingTask;
  source: EvalSource;
  refId: string;
  onEvaluated: (attemptId: string, evaluation: Evaluation) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [prepLeft, setPrepLeft] = useState(task.prepSeconds);
  const [elapsed, setElapsed] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recognitionOk, setRecognitionOk] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [notes, setNotes] = useState("");
  const [tts, setTts] = useState(false);

  const recRef = useRef<RecognitionLike | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingRef = useRef(false);
  const startedAt = useRef(0);
  const durationRef = useRef(0);

  const target = task.part === 2 ? task.speakSeconds : task.speakSeconds * task.questions.length;
  const hardStop = target + 45;

  useEffect(() => {
    setRecognitionOk(!!createRecognition());
    setTts(ttsSupported());
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "prep") return;
    if (prepLeft <= 0) {
      void startRecording();
      return;
    }
    const t = setTimeout(() => setPrepLeft((p) => p - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, prepLeft]);

  useEffect(() => {
    if (phase !== "recording") return;
    const t = setInterval(() => {
      const s = (Date.now() - startedAt.current) / 1000;
      setElapsed(s);
      if (s >= hardStop) stopRecording();
    }, 250);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function cleanup() {
    recordingRef.current = false;
    try {
      recRef.current?.abort();
    } catch {}
    try {
      if (mediaRef.current?.state === "recording") mediaRef.current.stop();
    } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (ttsSupported()) window.speechSynthesis.cancel();
  }

  async function readQuestion() {
    const q = task.cueCard ? `${task.cueCard.topic} You should say: ${task.cueCard.bullets.join(", ")}.` : task.questions[qIndex];
    await speak(q.replace(/^\(Part \d\)\s*/, ""), { gender: "female", rate: 0.95 });
  }

  function begin() {
    setError(null);
    if (task.prepSeconds > 0) {
      setPrepLeft(task.prepSeconds);
      setPhase("prep");
    } else void startRecording();
  }

  async function startRecording() {
    setError(null);
    setFinalText("");
    setInterim("");
    setAudioUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const chunks: Blob[] = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      mr.onstop = () => setAudioUrl(URL.createObjectURL(new Blob(chunks, { type: mr.mimeType })));
      mr.start();
      mediaRef.current = mr;
    } catch {
      setError("We couldn't access your microphone. Allow microphone access in your browser, or type your answer after pressing Stop.");
    }

    const rec = createRecognition();
    recRef.current = rec;
    if (rec) {
      rec.onresult = (e) => {
        let fin = "";
        let int = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) fin += r[0].transcript + " ";
          else int += r[0].transcript;
        }
        if (fin) setFinalText((t) => (t + " " + fin).replace(/\s+/g, " ").trimStart());
        setInterim(int);
      };
      rec.onerror = (e) => {
        if (e.error === "not-allowed") setRecognitionOk(false);
      };
      // Browsers end recognition after silence; keep it going while we are recording.
      rec.onend = () => {
        if (recordingRef.current) {
          try {
            rec.start();
          } catch {}
        }
      };
      try {
        rec.start();
      } catch {}
    }
    recordingRef.current = true;
    startedAt.current = Date.now();
    setElapsed(0);
    setPhase("recording");
  }

  function stopRecording() {
    durationRef.current = Math.round((Date.now() - startedAt.current) / 1000);
    recordingRef.current = false;
    try {
      recRef.current?.stop();
    } catch {}
    try {
      if (mediaRef.current?.state === "recording") mediaRef.current.stop();
    } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setFinalText((t) => (t + " " + interim).trim());
    setInterim("");
    setPhase("review");
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const { attemptId, evaluation } = await requestEvaluation({
        kind: "speaking",
        source,
        refId,
        text: finalText,
        durationSec: durationRef.current || Math.round(elapsed),
      });
      setEvaluation(evaluation);
      onEvaluated(attemptId, evaluation);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const accent = "var(--speaking)";

  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="eyebrow" style={{ color: accent }}>
            Speaking Part {task.part} · aim for about {fmtTime(target)}
          </div>
          {tts && phase !== "recording" && (
            <button type="button" onClick={readQuestion} className="btn btn-ghost px-3 py-1.5 text-sm">
              <Icon name="volume" size={16} /> Hear the examiner
            </button>
          )}
        </div>
        {task.cueCard ? (
          <div className="rounded-2xl border-2 border-dashed p-4" style={{ borderColor: `color-mix(in srgb, ${accent} 50%, transparent)` }}>
            <p className="font-display text-xl font-bold">{task.cueCard.topic}</p>
            <p className="mt-2 text-sm font-semibold" style={{ color: "var(--muted)" }}>
              You should say:
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {task.cueCard.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            {task.questions.length > 1 && (
              <div className="mt-3 border-t pt-3 text-sm" style={{ borderColor: "var(--line)" }}>
                <span className="font-semibold">Follow-up questions:</span>
                <ul className="mt-1 list-disc pl-5" style={{ color: "var(--muted)" }}>
                  {task.questions.slice(1).map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <ol className="space-y-2">
            {task.questions.map((q, i) => (
              <li
                key={q}
                className="flex gap-3 rounded-xl p-3 transition-colors"
                style={{ background: phase === "recording" && i === qIndex ? `color-mix(in srgb, ${accent} 12%, transparent)` : "var(--surface-2)" }}
              >
                <span className="font-bold" style={{ color: accent }}>
                  Q{i + 1}
                </span>
                <span className="font-semibold">{q}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {!evaluation && (
        <div className="card p-5 text-center">
          {phase === "idle" && (
            <>
              <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
                {task.prepSeconds > 0
                  ? `You'll get ${task.prepSeconds} seconds to prepare, then recording starts automatically.`
                  : task.questions.length > 1
                    ? "Answer each question in turn. Press “Next question” as you move on."
                    : "Press start and answer naturally."}
                {!recognitionOk && " Your browser can't transcribe speech, so you'll type what you said afterwards (Chrome or Edge give live transcripts)."}
              </p>
              <button type="button" onClick={begin} className="btn btn-primary" style={{ background: accent, boxShadow: `0 4px 0 color-mix(in srgb, ${accent} 60%, #000)` }}>
                <Icon name="mic" size={18} /> {task.prepSeconds > 0 ? "Start preparation" : "Start speaking"}
              </button>
            </>
          )}

          {phase === "prep" && (
            <div>
              <div className="eyebrow mb-2">Preparation time</div>
              <div className="font-display text-5xl font-bold" aria-live="polite">
                {fmtTime(prepLeft)}
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Jot down keywords (not sentences)…"
                aria-label="Preparation notes"
                className="input mt-4 min-h-[90px] text-left"
              />
              <button type="button" onClick={() => setPrepLeft(0)} className="btn btn-ghost mt-4">
                I&apos;m ready — start speaking
              </button>
            </div>
          )}

          {phase === "recording" && (
            <div>
              <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full text-white animate-pulse-ring" style={{ background: accent }}>
                <Icon name="mic" size={32} />
              </div>
              <div className="font-display text-4xl font-bold" aria-live="off">
                {fmtTime(elapsed)}
              </div>
              <div className="mx-auto mt-3 h-2 max-w-xs overflow-hidden rounded-full" style={{ background: "var(--surface-2)" }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, (elapsed / target) * 100)}%`, background: elapsed >= target ? "var(--success)" : accent }} />
              </div>
              {notes && (
                <p className="mx-auto mt-3 max-w-md whitespace-pre-line text-sm" style={{ color: "var(--muted)" }}>
                  Notes: {notes}
                </p>
              )}
              {recognitionOk && (
                <p className="mx-auto mt-4 min-h-[3rem] max-w-xl text-left text-[15px] leading-relaxed">
                  {finalText} <span style={{ color: "var(--muted)" }}>{interim}</span>
                </p>
              )}
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {!task.cueCard && qIndex < task.questions.length - 1 && (
                  <button type="button" className="btn btn-ghost" onClick={() => setQIndex((i) => i + 1)}>
                    Next question <Icon name="arrow" size={16} />
                  </button>
                )}
                <button type="button" className="btn btn-dark" onClick={stopRecording}>
                  <Icon name="stop" size={16} /> Stop
                </button>
              </div>
            </div>
          )}

          {phase === "review" && (
            <div className="text-left">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold">Your answer · {fmtTime(durationRef.current)}</h3>
                {audioUrl && <audio controls src={audioUrl} className="h-9 max-w-full" />}
              </div>
              <label className="mb-1 block text-sm font-semibold" htmlFor="transcript">
                {recognitionOk ? "Transcript (fix only words the computer misheard)" : "Type what you said, as closely as you can"}
              </label>
              <textarea id="transcript" value={finalText} onChange={(e) => setFinalText(e.target.value)} className="input min-h-[140px] leading-relaxed" />
              <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                {wordCount(finalText)} words
              </p>
              <div className="mt-4 flex flex-wrap justify-end gap-3">
                <button type="button" className="btn btn-ghost" onClick={() => { setPhase("idle"); setQIndex(0); }} disabled={busy}>
                  <Icon name="refresh" size={16} /> Try again
                </button>
                <button type="button" className="btn btn-primary" onClick={submit} disabled={busy || wordCount(finalText) < 8} style={{ background: accent, boxShadow: `0 4px 0 color-mix(in srgb, ${accent} 60%, #000)` }}>
                  {busy ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> The examiner is listening…
                    </>
                  ) : (
                    <>
                      <Icon name="sparkle" size={18} /> Get my band score
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
          {error && (
            <p role="alert" className="mt-4 text-sm font-semibold" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
        </div>
      )}

      {evaluation && <FeedbackCard evaluation={evaluation} accent={accent} />}
    </div>
  );
}
