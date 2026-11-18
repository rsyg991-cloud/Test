"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { completeConversation, type CompletionResult } from "@/app/actions/learn";
import type { ConversationScenario } from "@/content/types";
import { Celebration } from "@/components/Celebration";
import { Icon } from "@/components/icons";
import { requestEvaluation } from "@/components/task/evaluate-client";
import { FeedbackCard } from "@/components/task/FeedbackCard";
import { ListeningPlayer } from "@/components/task/ListeningPlayer";
import { QuestionList } from "@/components/task/QuestionList";
import { wordCount } from "@/components/task/speech";
import { CHATGPT_URL } from "@/lib/conversation/prompt";
import type { Evaluation } from "@/lib/ai/schema";
import { gradeQuestions, type Answers } from "@/lib/scoring";

const STEPS = ["Learn", "Listen", "Check", "Talk", "Reflect"] as const;
const ACCENT = "var(--speaking)";
const accentBtn = { background: ACCENT, boxShadow: `0 4px 0 color-mix(in srgb, ${ACCENT} 60%, #000)` };

export function ConversationFlow({
  scenario: s,
  stageName,
  prompt,
  completedBefore,
}: {
  scenario: ConversationScenario;
  stageName: string;
  prompt: string;
  completedBefore: boolean;
}) {
  const [step, setStep] = useState(0);
  const [flipped, setFlipped] = useState<Record<number, boolean>>({});
  const [answers, setAnswers] = useState<Answers>({});
  const [checkResult, setCheckResult] = useState<ReturnType<typeof gradeQuestions> | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [transcript, setTranscript] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [result, setResult] = useState<CompletionResult | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [pending, start] = useTransition();

  const passed = checkResult ? checkResult.correct >= 2 : false;
  const go = (i: number) => {
    setStep(i);
    window.scrollTo({ top: 0 });
  };

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      // Fallback for browsers without clipboard permission.
      const ta = document.createElement("textarea");
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function getFeedback() {
    setBusy(true);
    setError(null);
    try {
      const r = await requestEvaluation({ kind: "conversation", source: "conversation", refId: s.id, text: transcript });
      setEvaluation(r.evaluation);
      setAttemptId(r.attemptId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function finish() {
    setError(null);
    start(async () => {
      const r = await completeConversation(s.id, { attemptId: attemptId ?? undefined, checked: Object.values(checked).filter(Boolean).length });
      if (!r.ok) return setError(r.error);
      setResult(r);
      setCelebrate(true);
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/practice#conversations" className="grid h-10 w-10 place-items-center rounded-full" style={{ background: "var(--surface-2)" }} aria-label="Back to conversations">
          <Icon name="back" size={18} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="eyebrow truncate">
            AI Conversation · Stage {s.stage} · {stageName} · {s.ieltsPart}
          </div>
          <ol className="mt-1.5 flex gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}>
            {STEPS.map((label, i) => (
              <li key={label} className="flex-1">
                <span className="block h-1.5 rounded-full" style={{ background: i <= step ? ACCENT : "var(--surface-2)" }} />
                <span className="mt-1 hidden text-[11px] font-bold sm:block" style={{ color: i === step ? ACCENT : "var(--muted)" }}>
                  {label}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mb-8 flex items-start gap-4">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white" style={{ background: ACCENT }}>
          <Icon name="mic" size={26} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{s.title}</h1>
          <p className="mt-1" style={{ color: "var(--muted)" }}>
            {s.situation}
          </p>
          <p className="mt-1 text-sm font-semibold" style={{ color: "var(--muted)" }}>
            ~{s.minutes} min · {s.xp} XP{completedBefore && " · Completed before ✓"}
          </p>
        </div>
      </div>

      {/* 1. Learn */}
      {step === 0 && (
        <div className="animate-rise space-y-6">
          <section className="card p-6">
            <div className="eyebrow mb-2" style={{ color: ACCENT }}>
              Today you will practise
            </div>
            <ul className="grid gap-2 sm:grid-cols-3">
              {s.goals.map((g) => (
                <li key={g} className="flex gap-2 rounded-xl p-3 text-sm font-semibold" style={{ background: "var(--surface-2)" }}>
                  <Icon name="target" size={16} style={{ color: ACCENT, flexShrink: 0, marginTop: 2 }} /> {g}
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 font-display text-xl font-bold">Key phrases</h2>
            <ul className="space-y-3">
              {s.keyPhrases.map((p) => (
                <li key={p.phrase} className="rounded-2xl border p-4" style={{ borderColor: "var(--line)" }}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-lg font-bold" style={{ color: ACCENT }}>
                      {p.phrase}
                    </span>
                    <span className="chip" style={{ background: "var(--surface-2)" }}>
                      {p.use}
                    </span>
                  </div>
                  <p className="mt-1 italic" style={{ color: "var(--muted)" }}>
                    “{p.example}”
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card p-6">
              <div className="eyebrow mb-1" style={{ color: ACCENT }}>
                Grammar focus
              </div>
              <h2 className="font-display text-xl font-bold">{s.grammar.title}</h2>
              <p className="mt-2 leading-relaxed">{s.grammar.explanation}</p>
              <ul className="mt-3 space-y-1.5">
                {s.grammar.examples.map((e) => (
                  <li key={e} className="rounded-lg px-3 py-2 text-sm" style={{ background: "var(--surface-2)" }}>
                    {e}
                  </li>
                ))}
              </ul>
            </section>
            <section className="card p-6">
              <div className="eyebrow mb-3" style={{ color: ACCENT }}>
                Vocabulary · tap to flip
              </div>
              <div className="grid gap-2.5">
                {s.vocab.map((v, i) => (
                  <button
                    key={v.word}
                    type="button"
                    onClick={() => setFlipped((f) => ({ ...f, [i]: !f[i] }))}
                    aria-expanded={!!flipped[i]}
                    className="rounded-xl border p-3 text-left"
                    style={{ borderColor: "var(--line)", background: flipped[i] ? "color-mix(in srgb, var(--speaking) 10%, transparent)" : "var(--surface)" }}
                  >
                    <div className="font-bold">{v.word}</div>
                    <div className="text-sm" style={{ color: flipped[i] ? "var(--ink)" : "var(--muted)" }}>
                      {flipped[i] ? (
                        <>
                          {v.definition} <span className="italic" style={{ color: "var(--muted)" }}>— “{v.example}”</span>
                        </>
                      ) : (
                        "Can you guess the meaning?"
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>
          <div className="flex justify-end">
            <button type="button" className="btn btn-primary" style={accentBtn} onClick={() => go(1)}>
              Next: hear a model conversation <Icon name="arrow" size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 2. Listen */}
      {step === 1 && (
        <div className="animate-rise mx-auto max-w-3xl space-y-6">
          <p style={{ color: "var(--muted)" }}>Listen to how fluent speakers use today&apos;s phrases. Then read the transcript and notice the phrases in action.</p>
          <ListeningPlayer task={s.modelDialogue} revealScript />
          <div className="flex justify-between">
            <button type="button" className="btn btn-ghost" onClick={() => go(0)}>
              <Icon name="back" size={16} /> Back
            </button>
            <button type="button" className="btn btn-primary" style={accentBtn} onClick={() => go(2)}>
              Next: quick check <Icon name="arrow" size={18} />
            </button>
          </div>
        </div>
      )}

      {/* 3. Quick check */}
      {step === 2 && (
        <div className="animate-rise mx-auto max-w-3xl">
          <p className="mb-4" style={{ color: "var(--muted)" }}>
            Get at least 2 of 3 right to unlock your conversation.
          </p>
          <QuestionList
            questions={s.quickCheck}
            answers={answers}
            onChange={(id, val) => {
              setCheckResult(null);
              setAnswers((a) => ({ ...a, [id]: val }));
            }}
            results={checkResult?.results}
            accent={ACCENT}
          />
          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            {checkResult && !passed && (
              <>
                <span className="font-semibold" style={{ color: "var(--danger)" }}>
                  {checkResult.correct}/3 — review the explanations and try again.
                </span>
                <button type="button" className="btn btn-ghost" onClick={() => { setCheckResult(null); setAnswers({}); }}>
                  <Icon name="refresh" size={16} /> Try again
                </button>
              </>
            )}
            {!checkResult && (
              <button type="button" className="btn btn-primary" style={accentBtn} disabled={Object.keys(answers).length < s.quickCheck.length} onClick={() => setCheckResult(gradeQuestions(s.quickCheck, answers))}>
                Check answers
              </button>
            )}
            {passed && (
              <button type="button" className="btn btn-primary" style={accentBtn} onClick={() => go(3)}>
                {checkResult!.correct}/3 — you&apos;re ready to talk! <Icon name="arrow" size={18} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. Talk with ChatGPT */}
      {step === 3 && (
        <div className="animate-rise grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <section className="card overflow-hidden">
            <div className="p-6" style={{ background: "color-mix(in srgb, var(--speaking) 10%, var(--surface))" }}>
              <div className="eyebrow mb-1" style={{ color: ACCENT }}>
                Your role-play
              </div>
              <p className="font-semibold">
                ChatGPT will be <span style={{ color: ACCENT }}>{s.aiRole}</span>. You are {s.learnerRole}.
              </p>
            </div>
            <ol className="space-y-4 p-6">
              {[
                ["1", "Copy your ready-made prompt", "It tells ChatGPT its role, your level, today's phrases and how to give you feedback at the end."],
                ["2", "Open ChatGPT and paste it", "On your phone, use the ChatGPT app and tap the voice button to really speak. On a computer you can type or use voice."],
                ["3", "Have the conversation", `About ${s.turns} exchanges. Try to complete every mission. Say “END” when you finish to get ChatGPT's feedback.`],
                ["4", "Copy the conversation and come back", "Select the whole chat (or use the copy button on each message) — you'll paste it here for your BandUp feedback."],
              ].map(([n, t, b]) => (
                <li key={n} className="flex gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold text-white" style={{ background: ACCENT }}>
                    {n}
                  </span>
                  <div>
                    <div className="font-bold">{t}</div>
                    <div className="text-sm" style={{ color: "var(--muted)" }}>
                      {b}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-3 border-t p-6" style={{ borderColor: "var(--line)" }}>
              <button type="button" className="btn btn-primary" style={accentBtn} onClick={copyPrompt} aria-live="polite">
                <Icon name={copied ? "check" : "cards"} size={18} /> {copied ? "Prompt copied!" : "Copy prompt"}
              </button>
              <a href={CHATGPT_URL} target="_blank" rel="noopener noreferrer" className="btn btn-dark">
                Open ChatGPT <Icon name="arrow" size={16} />
              </a>
              <button type="button" className="btn btn-ghost" onClick={() => setShowPrompt((v) => !v)} aria-expanded={showPrompt}>
                <Icon name="eye" size={16} /> {showPrompt ? "Hide prompt" : "Preview prompt"}
              </button>
            </div>
            {showPrompt && (
              <pre className="mx-6 mb-6 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl p-4 text-xs leading-relaxed" style={{ background: "var(--surface-2)" }}>
                {prompt}
              </pre>
            )}
          </section>

          <aside className="space-y-6">
            <section className="card p-5">
              <h2 className="mb-3 font-display text-lg font-bold">Your missions</h2>
              <ul className="space-y-2">
                {s.missions.map((m) => (
                  <li key={m} className="flex gap-2 text-sm">
                    <Icon name="star" size={16} style={{ color: "var(--gold)", flexShrink: 0, marginTop: 2 }} /> {m}
                  </li>
                ))}
              </ul>
            </section>
            <section className="card p-5">
              <h2 className="mb-3 font-display text-lg font-bold">Keep these in front of you</h2>
              <ul className="space-y-1.5">
                {s.keyPhrases.map((p) => (
                  <li key={p.phrase} className="rounded-lg px-3 py-1.5 text-sm font-semibold" style={{ background: "var(--surface-2)" }}>
                    {p.phrase}
                  </li>
                ))}
              </ul>
            </section>
            <button type="button" className="btn btn-primary w-full" style={accentBtn} onClick={() => go(4)}>
              I&apos;ve finished my conversation <Icon name="arrow" size={18} />
            </button>
          </aside>
        </div>
      )}

      {/* 5. Reflect */}
      {step === 4 && (
        <div className="animate-rise mx-auto max-w-3xl space-y-6">
          <section className="card p-6">
            <h2 className="mb-3 font-display text-xl font-bold">How did it go?</h2>
            <ul className="space-y-2">
              {s.selfCheck.map((c, i) => (
                <li key={c}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl p-3" style={{ background: checked[i] ? "color-mix(in srgb, var(--success) 10%, transparent)" : "var(--surface-2)" }}>
                    <input type="checkbox" className="h-5 w-5" checked={!!checked[i]} onChange={(e) => setChecked((x) => ({ ...x, [i]: e.target.checked }))} disabled={!!result} />
                    <span className="font-semibold">{c}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          {!evaluation && (
            <section className="card p-6">
              <h2 className="font-display text-xl font-bold">Get your BandUp feedback</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                Paste the whole conversation from ChatGPT. We&apos;ll assess only your turns: fluency, vocabulary, grammar and how well you used today&apos;s phrases.
              </p>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={"Paste your conversation here…\n\nChatGPT: Hi! I don't think we've met yet…\nYou: Hi, nice to meet you. I'm…"}
                aria-label="Conversation transcript"
                className="input mt-4 min-h-[220px] text-[15px] leading-relaxed"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  {wordCount(transcript)} words
                </span>
                <button type="button" className="btn btn-primary" style={accentBtn} onClick={getFeedback} disabled={busy || wordCount(transcript) < 30}>
                  {busy ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Reviewing your conversation…
                    </>
                  ) : (
                    <>
                      <Icon name="sparkle" size={18} /> Get feedback
                    </>
                  )}
                </button>
              </div>
            </section>
          )}

          {evaluation && <FeedbackCard evaluation={evaluation} accent={ACCENT} />}

          {error && (
            <p role="alert" className="font-semibold" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3">
            {result ? (
              <Link href={result.nextHref} className="btn btn-primary" style={accentBtn}>
                {result.nextTitle} <Icon name="arrow" size={18} />
              </Link>
            ) : (
              <>
                {!evaluation && (
                  <button type="button" className="btn btn-ghost" onClick={finish} disabled={pending || busy}>
                    Complete without feedback
                  </button>
                )}
                {evaluation && (
                  <button type="button" className="btn btn-primary" style={accentBtn} onClick={finish} disabled={pending}>
                    {pending ? "Saving…" : "Complete conversation"} <Icon name="check" size={18} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {celebrate && result && (
        <Celebration
          title="Conversation complete!"
          subtitle={result.band != null ? "Your speaking estimate has been added to your progress." : "Paste your conversation next time to get a band estimate."}
          band={result.band}
          xp={result.activity.xpGained}
          streak={result.activity.streak}
          streakExtended={result.activity.streakExtended}
          freezeEarned={result.activity.freezeEarned}
          vocabAdded={result.vocabAdded}
          nextHref={result.nextHref}
          nextTitle={result.nextTitle}
          onClose={() => setCelebrate(false)}
        />
      )}
    </div>
  );
}
