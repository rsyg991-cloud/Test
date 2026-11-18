"use client";

import { useState } from "react";
import type { Evaluation } from "@/lib/ai/schema";
import { Icon } from "../icons";
import { ProgressBar } from "../ui";

export function FeedbackCard({ evaluation, accent = "var(--brand)" }: { evaluation: Evaluation; accent?: string }) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const e = evaluation;
  return (
    <section className="card animate-rise overflow-hidden" aria-label="Examiner feedback">
      <div className="flex flex-wrap items-center gap-5 p-5 sm:p-6" style={{ background: `color-mix(in srgb, ${accent} 10%, var(--surface))` }}>
        <div className="animate-pop grid h-24 w-24 shrink-0 place-items-center rounded-3xl text-white" style={{ background: accent }}>
          <div className="text-center">
            <div className="text-[10px] font-extrabold uppercase tracking-widest opacity-90">Band</div>
            <div className="font-display text-4xl font-bold leading-none">{e.overall_band.toFixed(1)}</div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="eyebrow mb-1 flex items-center gap-2">
            <Icon name="sparkle" size={14} /> {e.demo ? "Demo estimate (offline)" : "AI examiner feedback"}
          </div>
          <p className="font-semibold leading-snug">{e.summary}</p>
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="font-bold">Criteria</h3>
          {e.criteria.map((c) => (
            <div key={c.name}>
              <div className="mb-1 flex justify-between gap-2 text-sm font-semibold">
                <span>{c.name}</span>
                <span className="font-display">{c.band.toFixed(1)}</span>
              </div>
              <ProgressBar value={c.band / 9} color={accent} label={c.name} />
              <p className="mt-1.5 text-sm" style={{ color: "var(--muted)" }}>
                {c.comment}
              </p>
            </div>
          ))}
        </div>
        <div className="space-y-5">
          {e.strengths.length > 0 && (
            <div>
              <h3 className="mb-2 font-bold">What went well</h3>
              <ul className="space-y-1.5 text-sm">
                {e.strengths.map((s, i) => (
                  <li key={i} className="flex gap-2">
                    <Icon name="check" size={16} style={{ color: "var(--success)", flexShrink: 0, marginTop: 2 }} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h3 className="mb-2 font-bold">Your next 3 steps</h3>
            <ol className="space-y-2 text-sm">
              {e.improvements.map((s, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white" style={{ background: accent }}>
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {e.corrections.length > 0 && (
        <div className="border-t p-5 sm:p-6" style={{ borderColor: "var(--line)" }}>
          <h3 className="mb-3 font-bold">Language corrections</h3>
          <ul className="space-y-3">
            {e.corrections.map((c, i) => (
              <li key={i} className="rounded-xl p-3 text-sm" style={{ background: "var(--surface-2)" }}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="line-through" style={{ color: "var(--danger)" }}>
                    {c.original}
                  </span>
                  <Icon name="arrow" size={14} style={{ color: "var(--muted)" }} />
                  <span className="font-semibold" style={{ color: "var(--success)" }}>
                    {c.corrected}
                  </span>
                </div>
                <p className="mt-1" style={{ color: "var(--muted)" }}>
                  {c.explanation}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t p-5 sm:p-6" style={{ borderColor: "var(--line)" }}>
        <button type="button" onClick={() => setShowUpgrade((s) => !s)} className="flex w-full items-center justify-between font-bold" aria-expanded={showUpgrade}>
          <span className="flex items-center gap-2">
            <Icon name="bolt" size={18} style={{ color: accent }} /> See your answer one band higher
          </span>
          <Icon name="arrow" size={18} style={{ transform: showUpgrade ? "rotate(90deg)" : undefined, transition: "transform .2s" }} />
        </button>
        {showUpgrade && (
          <p className="mt-3 whitespace-pre-line rounded-xl p-4 text-[15px] leading-relaxed" style={{ background: "var(--surface-2)" }}>
            {e.upgraded_version}
          </p>
        )}
      </div>
    </section>
  );
}
