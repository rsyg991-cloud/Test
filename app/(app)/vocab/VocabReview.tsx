"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { finishVocabSession, reviewVocab } from "@/app/actions/study";
import { Confetti } from "@/components/Celebration";
import { Icon } from "@/components/icons";
import { speak, ttsSupported } from "@/components/task/speech";

interface Card {
  id: string;
  word: string;
  definition: string;
  example: string;
}

const GRADES = [
  { grade: 0 as const, label: "Forgot", hint: "again today", color: "var(--danger)" },
  { grade: 3 as const, label: "Hard", hint: "soon", color: "var(--writing)" },
  { grade: 4 as const, label: "Good", hint: "in a few days", color: "var(--reading)" },
  { grade: 5 as const, label: "Easy", hint: "later", color: "var(--listening)" },
];

export function VocabReview({ cards }: { cards: Card[] }) {
  const [queue, setQueue] = useState(cards);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const [tts, setTts] = useState(false);
  useEffect(() => setTts(ttsSupported()), []);
  const card = queue[0];

  function grade(g: 0 | 3 | 4 | 5) {
    if (!card) return;
    start(async () => {
      await reviewVocab(card.id, g);
      const rest = queue.slice(1);
      // Forgotten cards come back at the end of this session.
      const next = g === 0 ? [...rest, card] : rest;
      setReviewed((r) => r + 1);
      setRevealed(false);
      setQueue(next);
      if (next.length === 0) {
        await finishVocabSession(reviewed + 1);
        setDone(true);
      }
    });
  }

  if (done || !card) {
    return (
      <div className="card animate-pop mx-auto max-w-md p-8 text-center">
        {done && <Confetti count={50} />}
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-[10px] " style={{ background: "var(--highlighter)", color: "var(--on-highlighter)" }}>
          <Icon name="check" size={30} strokeWidth={3} />
        </div>
        <h2 className="mt-4 font-display text-2xl font-bold">{done ? "Deck cleared!" : "Nothing to review"}</h2>
        <p className="mt-2" style={{ color: "var(--muted)" }}>
          {done ? `You reviewed ${reviewed} card${reviewed === 1 ? "" : "s"}. They'll come back right before you'd forget them.` : "New words from your lessons will appear here when they're due."}
        </p>
        <Link href="/dashboard" className="btn btn-primary mt-6">
          Back to today
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-3 flex justify-between text-sm font-semibold" style={{ color: "var(--muted)" }}>
        <span>{queue.length} left</span>
        <span>{reviewed} reviewed</span>
      </div>
      <div className="card animate-rise p-8 text-center" key={card.id + queue.length}>
        <div className="flex items-center justify-center gap-2">
          <h2 className="font-display text-4xl font-bold">{card.word}</h2>
          {tts && (
            <button type="button" onClick={() => speak(card.word)} aria-label={`Pronounce ${card.word}`} className="grid h-9 w-9 place-items-center rounded-full" style={{ background: "var(--surface-2)" }}>
              <Icon name="volume" size={16} />
            </button>
          )}
        </div>
        {revealed ? (
          <div className="animate-rise mt-6">
            <p className="text-lg font-semibold">{card.definition}</p>
            <p className="mt-3 italic" style={{ color: "var(--muted)" }}>
              “{card.example}”
            </p>
          </div>
        ) : (
          <p className="mt-6" style={{ color: "var(--muted)" }}>
            Say the meaning out loud, then check.
          </p>
        )}
      </div>
      {revealed ? (
        <div className="mt-5 grid grid-cols-4 gap-2">
          {GRADES.map((g) => (
            <button key={g.grade} type="button" disabled={pending} onClick={() => grade(g.grade)} className="rounded-[10px] border-2 p-3 text-center transition-transform active:scale-95" style={{ borderColor: g.color }}>
              <div className="font-bold" style={{ color: g.color }}>
                {g.label}
              </div>
              <div className="text-[11px]" style={{ color: "var(--muted)" }}>
                {g.hint}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <button type="button" className="btn btn-primary mt-5 w-full py-3.5" onClick={() => setRevealed(true)}>
          <Icon name="eye" size={18} /> Show meaning
        </button>
      )}
    </div>
  );
}
