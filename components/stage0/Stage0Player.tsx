"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { completeStage0Lesson, completeStage0Review, type Stage0Completion } from "@/app/actions/stage0";
import type { StepAnswer } from "@/lib/stage0/grade";
import type { ViewItem, ViewStep } from "@/lib/stage0/view";
import { useT } from "@/lib/i18n/client";
import { Confetti } from "../Celebration";
import { Icon } from "../icons";
import { ProgressBar } from "../ui";
import { speak, stopSpeech, ttsSupported } from "../task/speech";

/**
 * Plays one Stage 0 lesson, step by step. Rules the player keeps (and the server re-checks):
 * - hidden items never show English text; supported items always have a sound button;
 * - reading and decoding steps hold the target's audio back until the learner has answered;
 * - speaking is optional, never scored by speech recognition: the learner compares with the model.
 */

type Feedback = null | "right" | "wrong" | "revealed";

/** Sentence-final punctuation: the next word starts with a capital. */
const END = new Set(["p:full-stop", "p:exclamation", "p:question-mark"]);
const PUNCT: Record<string, string> = { "p:full-stop": ".", "p:exclamation": "!", "p:question-mark": "?", "p:comma": "," };

/** Same order every time for a step, but not always the target first. */
function shuffled<T>(list: readonly T[], seed: string): T[] {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) >>> 0;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

async function say(text: string, rate = 0.8) {
  if (!text || !ttsSupported()) return;
  stopSpeech();
  await speak(text, { rate });
}

function SoundButton({ text, label, big, disabled, onPlay }: { text: string; label?: string; big?: boolean; disabled?: boolean; onPlay?: () => void }) {
  return (
    <button
      type="button"
      className={`btn ${big ? "btn-primary px-6 py-4 text-lg" : "btn-ghost"}`}
      disabled={disabled}
      onClick={() => {
        onPlay?.();
        void say(text);
      }}
      aria-label={label ?? text}
    >
      <Icon name="volume" size={big ? 24 : 18} /> {label}
    </button>
  );
}

/** A picture (or Arabic meaning) card. Never shows English text. */
function PictureCard({ item, onClick, state, disabled }: { item: ViewItem; onClick?: () => void; state?: "right" | "wrong" | "dim"; disabled?: boolean }) {
  const border = state === "right" ? "var(--success)" : state === "wrong" ? "var(--danger)" : "var(--line)";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="card flex min-h-28 flex-col items-center justify-center gap-2 p-4 transition"
      style={{ borderColor: border, borderWidth: 2, opacity: state === "dim" ? 0.55 : 1 }}
    >
      {item.image ? <span className="text-5xl leading-none" aria-hidden>{item.image}</span> : null}
      <span className="ar text-sm" dir="rtl" style={{ color: "var(--muted)" }}>
        {item.ar}
      </span>
    </button>
  );
}

function Word({ item, size = "text-4xl" }: { item: ViewItem; size?: string }) {
  if (!item.text) return null;
  return (
    <span dir="ltr" lang="en" className={`font-bold ${size}`}>
      {item.text}
    </span>
  );
}

function Letters({ item }: { item: ViewItem }) {
  const t = item.text ?? "";
  const single = /^[a-z]$/.test(t);
  return (
    <span dir="ltr" lang="en" className="num text-6xl font-bold">
      {single ? `${t.toUpperCase()} ${t}` : t}
    </span>
  );
}

/** Text made of item tokens, with punctuation attached and the first word capitalised. */
function Tokens({
  tokens,
  items,
  onTap,
  picked,
}: {
  tokens: string[];
  items: Record<string, ViewItem>;
  onTap?: (id: string) => void;
  picked?: string | null;
}) {
  // Each word carries the punctuation that follows it, so "Nat." never splits into "Nat ." on screen.
  const groups: { id: string; i: number; punct: string }[] = [];
  tokens.forEach((id, i) => {
    if (PUNCT[id] !== undefined || id === "p:apostrophe") {
      if (groups.length) groups[groups.length - 1].punct += PUNCT[id] ?? "";
    } else groups.push({ id, i, punct: "" });
  });
  return (
    <p dir="ltr" lang="en" className="text-3xl font-bold leading-relaxed">
      {groups.map(({ id, i, punct }, g) => {
        const it = items[id];
        const raw = it?.text ?? "";
        const text = i === 0 || END.has(tokens[i - 1]) ? raw.charAt(0).toUpperCase() + raw.slice(1) : raw;
        const supported = it?.mode === "supported";
        return (
          <Fragment key={i}>
          {g > 0 ? " " : ""}
          <span className="whitespace-nowrap">
            <button
              type="button"
              className="rounded"
              style={{
                textDecoration: supported ? "underline dotted" : undefined,
                textUnderlineOffset: 6,
                background: picked === id ? "var(--highlighter)" : undefined,
                color: picked === id ? "var(--on-highlighter)" : undefined,
              }}
              onClick={() => (supported ? void say(it.say) : onTap?.(id))}
            >
              {text}
            </button>
            {punct}
          </span>
          </Fragment>
        );
      })}
    </p>
  );
}

function Recorder({ onRecorded }: { onRecorded: () => void }) {
  const { t } = useT();
  const [state, setState] = useState<"idle" | "rec" | "done" | "none">("idle");
  const [url, setUrl] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  useEffect(() => {
    if (typeof window !== "undefined" && (!navigator.mediaDevices || typeof MediaRecorder === "undefined")) setState("none");
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);
  if (state === "none") return <p className="ar text-sm" style={{ color: "var(--muted)" }}>{t("starter.noMic")}</p>;
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {state !== "rec" ? (
        <button
          type="button"
          className="btn btn-ghost"
          onClick={async () => {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              const chunks: Blob[] = [];
              const r = new MediaRecorder(stream);
              r.ondataavailable = (e) => chunks.push(e.data);
              r.onstop = () => {
                stream.getTracks().forEach((tr) => tr.stop());
                setUrl(URL.createObjectURL(new Blob(chunks, { type: r.mimeType })));
                setState("done");
                onRecorded();
              };
              rec.current = r;
              r.start();
              setState("rec");
              setTimeout(() => r.state === "recording" && r.stop(), 6000);
            } catch {
              setState("none");
            }
          }}
        >
          <Icon name="mic" size={18} /> {t("starter.record")}
        </button>
      ) : (
        <button type="button" className="btn btn-primary" onClick={() => rec.current?.stop()}>
          <Icon name="stop" size={18} /> {t("starter.stopRecording")}
        </button>
      )}
      {url ? (
        <button type="button" className="btn btn-ghost" onClick={() => void new Audio(url).play()}>
          <Icon name="play" size={18} /> {t("starter.playMine")}
        </button>
      ) : null}
    </div>
  );
}

/** `review`: a daily review session (steps from completed lessons), sent back by step id. */
export function Stage0Player({ lessonId, titleAr, views, review = false }: { lessonId: string; titleAr: string; views: ViewStep[]; review?: boolean }) {
  const { t } = useT();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, StepAnswer>>({});
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [tries, setTries] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [order, setOrder] = useState<string[]>([]);
  const [heard, setHeard] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [result, setResult] = useState<Stage0Completion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const view = views[index];
  const s = view.step;
  const items = view.items;
  const last = index === views.length - 1;
  const options = useMemo(() => ("options" in s ? shuffled(s.options as string[], s.id) : []), [s]);

  useEffect(() => {
    setFeedback(null);
    setTries(0);
    setChoice(null);
    setTyped("");
    setOrder([]);
    setHeard(false);
    setRecorded(false);
    // Steps that are about listening start with the sound.
    if (s.type === "listenPick" || s.type === "contrast" || s.type === "spell") void say(items[s.target]?.say ?? "");
    if (s.type === "show") void say(s.tokens.map((id) => items[id]?.say ?? "").join(" "));
    if (s.type === "namePick") void say(s.letter.toUpperCase());
    if (s.type === "nameSpellPick") void say((items[s.target]?.text ?? "").toUpperCase().split("").join(", "), 0.7);
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  const record = (a: Omit<StepAnswer, "stepId">) => setAnswers((prev) => ({ ...prev, [s.id]: { stepId: s.id, ...a } }));

  const targetSay = () => {
    if (s.type === "soundPick") return view.soundKeyword ?? items[s.target]?.say ?? "";
    if ("target" in s && typeof s.target === "string") return items[s.target]?.say ?? "";
    return "";
  };

  /** Grade a choice locally for immediate feedback; the server grades again. */
  function answer(value: { choice?: string; typed?: string; order?: string[] }) {
    if (feedback === "right" || feedback === "revealed") return;
    let ok = false;
    if (s.type === "namePick") ok = value.choice === s.letter;
    else if (s.type === "spell") ok = (value.typed ?? "").trim().toLowerCase() === (items[s.target]?.text ?? "").toLowerCase();
    else if (s.type === "build") {
      const want = s.tokens.filter((x) => !x.startsWith("p:"));
      ok = !!value.order && value.order.join("|") === want.join("|");
    } else if ("target" in s) ok = value.choice === s.target;
    const hinted = tries > 0;
    if (ok || tries > 0) {
      record({ ...value, hinted: ok && hinted, audioBeforeAnswer: heard });
      setFeedback(ok ? "right" : "revealed");
      const sayIt = targetSay();
      if (sayIt) void say(sayIt);
    } else {
      setFeedback("wrong");
      setTries(1);
    }
  }

  const canNext =
    s.type === "teach" || s.type === "show" || s.type === "say" ? true : feedback === "right" || feedback === "revealed";

  function next() {
    if (s.type === "say" && !answers[s.id]) record({ skipped: !recorded, recorded });
    if (last) {
      const final = { ...answers };
      if (s.type === "say" && !final[s.id]) final[s.id] = { stepId: s.id, skipped: !recorded, recorded };
      start(async () => {
        const r = review
          ? await completeStage0Review(
              views.map((v) => v.step.id),
              Object.values(final),
            )
          : await completeStage0Lesson(lessonId, Object.values(final));
        if (r.ok) setResult(r);
        else setError(r.error);
      });
      return;
    }
    setIndex((i) => i + 1);
  }

  if (result) return <Result result={result} review={review} />;

  const stateOf = (id: string): "right" | "wrong" | "dim" | undefined => {
    if (!feedback || feedback === "wrong") return feedback === "wrong" && choice === id ? "wrong" : undefined;
    if ("target" in s && id === s.target) return "right";
    return "dim";
  };
  const locked = feedback === "right" || feedback === "revealed";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/starter" className="btn btn-ghost px-3 py-2" aria-label={t("starter.back")}>
          <Icon name="back" size={18} />
        </Link>
        <div className="flex-1">
          <div className="ar text-sm font-bold" dir="rtl">{titleAr}</div>
          <ProgressBar value={(index + 1) / views.length} label={t("starter.stepOf", { n: index + 1, total: views.length })} />
        </div>
        <span className="num text-sm" style={{ color: "var(--muted)" }}>
          {t("starter.stepOf", { n: index + 1, total: views.length })}
        </span>
      </div>

      <div className="card space-y-6 p-6 text-center">
        <p className="ar text-lg font-bold" dir="rtl">{s.ar}</p>

        {s.type === "teach" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-center gap-6">
              {s.teaches.filter((id) => id.startsWith("g:") || id.startsWith("sw:")).map((id) => (
                <div key={id} className="flex flex-col items-center gap-2">
                  {id.startsWith("g:") ? <Letters item={items[id]} /> : <Word item={items[id]} size="text-6xl" />}
                </div>
              ))}
              {s.keyword && items[s.keyword] ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-6xl" aria-hidden>{items[s.keyword].image}</span>
                  {items[s.keyword].mode === "readable" ? <Word item={items[s.keyword]} size="text-2xl" /> : null}
                  <SoundButton text={items[s.keyword].say} />
                </div>
              ) : null}
            </div>
            {s.teaches.filter((id) => id.startsWith("p:")).length ? (
              <div className="flex flex-wrap justify-center gap-2">
                {s.teaches.filter((id) => id.startsWith("p:")).map((id) => (
                  <span key={id} className="chip" dir="ltr" style={{ background: "var(--brand-soft)" }}>{items[id].text}</span>
                ))}
              </div>
            ) : null}
            <p className="ar leading-loose" dir="rtl">{s.explainAr}</p>
          </div>
        )}

        {s.type === "show" && (
          <div className="space-y-4">
            <Tokens tokens={s.tokens} items={items} />
            <SoundButton big text={s.tokens.map((id) => items[id]?.say ?? "").join(" ")} label={t("starter.listen")} />
          </div>
        )}

        {(s.type === "soundPick" || s.type === "namePick") && (
          <div className="space-y-4">
            <SoundButton big text={s.type === "namePick" ? s.letter.toUpperCase() : targetSay()} label={t("starter.listen")} onPlay={() => setHeard(true)} />
            {s.type === "soundPick" ? <p className="ar text-xs" style={{ color: "var(--muted)" }}>{t("starter.tempSound")}</p> : null}
            <div className="grid grid-cols-3 gap-3">
              {(s.type === "namePick" ? shuffled(s.options, s.id) : options).map((o) => (
                <button
                  key={o}
                  type="button"
                  disabled={locked}
                  className="card p-4"
                  style={{ borderWidth: 2, borderColor: stateFor(s.type === "namePick" ? s.letter : (s as { target: string }).target, o) }}
                  onClick={() => {
                    setChoice(o);
                    answer({ choice: o });
                  }}
                >
                  {s.type === "namePick" ? (
                    <span dir="ltr" className="num text-4xl font-bold">{`${o.toUpperCase()} ${o}`}</span>
                  ) : (
                    <Letters item={items[o]} />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {(s.type === "listenPick" || s.type === "contrast") && (
          <div className="space-y-4">
            <SoundButton big text={items[s.target].say} label={t("starter.listen")} />
            <div className={`grid gap-3 ${options.length > 2 ? "grid-cols-3" : "grid-cols-2"}`}>
              {options.map((o) => (
                <PictureCard key={o} item={items[o]} state={stateOf(o)} disabled={locked} onClick={() => { setChoice(o); answer({ choice: o }); }} />
              ))}
            </div>
          </div>
        )}

        {s.type === "readPick" && (
          <div className="space-y-4">
            <Word item={items[s.target]} size="text-6xl" />
            <div className="grid grid-cols-3 gap-3">
              {options.map((o) => (
                <PictureCard key={o} item={{ ...items[o], ar: "" }} state={stateOf(o)} disabled={locked} onClick={() => { setChoice(o); answer({ choice: o }); }} />
              ))}
            </div>
            {locked ? <SoundButton text={items[s.target].say} /> : null}
          </div>
        )}

        {s.type === "decodePick" && (
          <div className="space-y-4">
            <Word item={items[s.target]} size="text-6xl" />
            {items[s.target].kind === "pseudo" ? (
              <div><span className="chip" style={{ background: "var(--brand-soft)" }}>{t("starter.notRealWord")}</span></div>
            ) : null}
            <p className="ar text-sm" style={{ color: "var(--muted)" }}>{t("starter.chooseSound")}</p>
            <div className="grid grid-cols-3 gap-3">
              {options.map((o, i) => (
                <div key={o} className="card flex flex-col items-center gap-2 p-3" style={{ borderWidth: 2, borderColor: stateFor(s.target, o) }}>
                  <SoundButton text={items[o].say} label={t("starter.soundN", { n: i + 1 })} />
                  <button type="button" className="btn btn-marker w-full" disabled={locked} onClick={() => { setChoice(o); answer({ choice: o }); }}>
                    <Icon name="check" size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {s.type === "nameSpellPick" && (
          <div className="space-y-4">
            <SoundButton big text={(items[s.target].text ?? "").toUpperCase().split("").join(", ")} label={t("starter.listen")} />
            <div className="grid grid-cols-3 gap-3">
              {options.map((o) => (
                <button key={o} type="button" disabled={locked} className="card p-4" style={{ borderWidth: 2, borderColor: stateFor(s.target, o) }} onClick={() => { setChoice(o); answer({ choice: o }); }}>
                  <Word item={items[o]} size="text-3xl" />
                </button>
              ))}
            </div>
          </div>
        )}

        {s.type === "readSentence" && (
          <div className="space-y-4">
            <div className="ruled rounded-[10px] border p-4 text-start" style={{ borderColor: "var(--line)" }}>
              <Tokens tokens={s.tokens} items={items} />
            </div>
            <div className={`grid gap-3 ${options.length > 2 ? "grid-cols-3" : "grid-cols-2"}`}>
              {options.map((o) => (
                <PictureCard key={o} item={items[o]} state={stateOf(o)} disabled={locked} onClick={() => { setChoice(o); answer({ choice: o }); }} />
              ))}
            </div>
            {locked ? <SoundButton text={s.tokens.map((id) => items[id]?.say ?? "").filter(Boolean).join(" ")} label={t("starter.listen")} /> : null}
          </div>
        )}

        {s.type === "readText" && (
          <div className="space-y-3">
            <Tokens tokens={s.tokens} items={items} picked={choice} onTap={(id) => { if (!locked && (s.options as string[]).includes(id)) { setChoice(id); answer({ choice: id }); } }} />
            <p className="ar text-xs" style={{ color: "var(--muted)" }}>{t("starter.tapToHear")}</p>
          </div>
        )}

        {s.type === "spell" && (
          <form
            className="mx-auto max-w-sm space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              answer({ typed });
            }}
          >
            <SoundButton big text={items[s.target].say} label={t("starter.listen")} />
            <input
              className="input text-center text-2xl"
              dir="ltr"
              lang="en"
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck={false}
              value={typed}
              disabled={locked}
              placeholder={t("starter.typeHere")}
              onChange={(e) => setTyped(e.target.value)}
            />
            <button className="btn btn-primary w-full" disabled={locked || !typed.trim()}>
              {t("starter.check")}
            </button>
          </form>
        )}

        {s.type === "build" && (
          <BuildTiles
            key={s.id}
            tokens={s.tokens}
            items={items}
            order={order}
            setOrder={setOrder}
            locked={locked}
            onCheck={(o) => answer({ order: o })}
          />
        )}

        {s.type === "say" && (
          <div className="space-y-4">
            <Tokens tokens={s.model} items={items} />
            <SoundButton big text={s.model.map((id) => items[id]?.say ?? "").join(" ")} label={t("starter.model")} />
            <Recorder onRecorded={() => setRecorded(true)} />
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" className="btn btn-marker" onClick={() => { record({ recorded, selfMark: true }); next(); }}>
                <Icon name="check" size={16} /> {t("starter.saidIt")}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => { record({ recorded, selfMark: false }); next(); }}>
                {t("starter.notYet")}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => { record({ skipped: true }); next(); }}>
                {t("starter.skip")}
              </button>
            </div>
          </div>
        )}

        {feedback === "wrong" || feedback === "revealed" || feedback === "right" ? (
          <div
            className="rounded-[10px] p-4 text-start"
            style={{ background: feedback === "right" ? "color-mix(in srgb, var(--success) 12%, transparent)" : "color-mix(in srgb, var(--danger) 10%, transparent)" }}
          >
            <div className="flex items-center gap-2 font-bold" style={{ color: feedback === "right" ? "var(--success)" : "var(--danger)" }}>
              <Icon name={feedback === "right" ? "check" : "x"} size={18} />
              {feedback === "right" ? t("starter.correct") : t("starter.notQuite")}
            </div>
            {feedback !== "right" && "wrongAr" in s ? <p className="ar mt-2 leading-loose" dir="rtl">{s.wrongAr}</p> : null}
            {feedback === "wrong" ? <p className="ar mt-1 text-sm" dir="rtl">{t("starter.tryAgain")}</p> : null}
          </div>
        ) : null}
      </div>

      {error ? <p className="text-center" style={{ color: "var(--danger)" }}>{error}</p> : null}
      {s.type !== "say" ? (
        <button type="button" className="btn btn-primary w-full py-4 text-lg" disabled={!canNext || pending} onClick={next}>
          {pending ? t("starter.saving") : last ? t("starter.finish") : t("starter.next")}
        </button>
      ) : null}
    </div>
  );

  function stateFor(target: string, id: string) {
    if (feedback === "wrong" && choice === id) return "var(--danger)";
    if (locked && id === target) return "var(--success)";
    return "var(--line)";
  }
}

function BuildTiles({
  tokens,
  items,
  order,
  setOrder,
  locked,
  onCheck,
}: {
  tokens: string[];
  items: Record<string, ViewItem>;
  order: string[];
  setOrder: (o: string[]) => void;
  locked: boolean;
  onCheck: (o: string[]) => void;
}) {
  const { t } = useT();
  const words = tokens.filter((x) => !x.startsWith("p:"));
  const pool = useMemo(() => shuffled(words, words.join("|")), [words.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  const used = new Set(order);
  const end = tokens.filter((x) => x.startsWith("p:")).at(-1);
  const built = order.map((id, i) => {
    const txt = items[id]?.text ?? "";
    return i === 0 ? txt.charAt(0).toUpperCase() + txt.slice(1) : txt;
  });
  return (
    <div className="space-y-4">
      <div className="ruled min-h-16 rounded-[10px] border p-3 text-2xl font-bold" dir="ltr" lang="en" style={{ borderColor: "var(--line)" }}>
        {built.join(" ")}
        {order.length === words.length && end ? PUNCT[end] : ""}
      </div>
      <div className="flex flex-wrap justify-center gap-2" dir="ltr">
        {pool.map((id, i) =>
          used.has(id) ? null : (
            <button key={`${id}-${i}`} type="button" disabled={locked} className="btn btn-ghost text-xl" onClick={() => setOrder([...order, id])}>
              {items[id]?.text}
            </button>
          ),
        )}
      </div>
      <div className="flex justify-center gap-2">
        <button type="button" className="btn btn-ghost" disabled={locked || !order.length} onClick={() => setOrder([])}>
          <Icon name="refresh" size={16} /> {t("starter.clear")}
        </button>
        <button type="button" className="btn btn-primary" disabled={locked || order.length !== words.length} onClick={() => onCheck(order)}>
          {t("starter.check")}
        </button>
      </div>
    </div>
  );
}

function Result({ result, review }: { result: Stage0Completion; review: boolean }) {
  const { t } = useT();
  const g = result.grade;
  return (
    <div className="mx-auto max-w-lg space-y-5 text-center">
      <Confetti count={60} />
      <div className="card space-y-4 p-8">
        <Icon name="trophy" size={44} style={{ margin: "0 auto", color: "var(--gold)" }} />
        <h1 className="font-display text-3xl">{t(review ? "starter.reviewDone" : "starter.resultTitle")}</h1>
        {g.total ? <p className="num text-lg">{t("starter.scoreLine", { correct: g.correct, total: g.total })}</p> : null}
        {result.unlockedStage1 ? <p className="font-bold" style={{ color: "var(--success)" }}>{t("starter.stage1Open")}</p> : null}
        {g.gate && g.gate.retake.length ? (
          <p className="ar" style={{ color: "var(--danger)" }}>
            {t("starter.retake", { parts: g.gate.retake.map((p) => t(`starter.part.${p}`)).join("، ") })}
          </p>
        ) : null}
        {g.gate && g.gate.supports.length ? (
          <p className="ar text-sm" style={{ color: "var(--muted)" }}>
            {t("starter.supports", { skills: g.gate.supports.map((p) => t(`starter.support.${p}`)).join("، ") })}
          </p>
        ) : null}
        <div className="flex flex-col gap-2">
          <Link href={result.nextHref} className="btn btn-primary">
            {result.nextHref.startsWith("/starter/") ? t("starter.nextLesson") : result.nextHref === "/dashboard" ? t("starter.toDashboard") : t("starter.back")}
          </Link>
          {result.nextHref !== "/starter" && (
            <Link href="/starter" className="btn btn-ghost">
              {t("starter.back")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
