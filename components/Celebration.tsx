"use client";

import { useT } from "@/lib/i18n/client";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { Icon } from "./icons";

const COLORS = ["#ff6b4a", "#f4a623", "#7c5cff", "#0e9f8e", "#e5486b", "#14213d"];

export function Confetti({ count = 80 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 2.2 + Math.random() * 1.6,
        dx: `${(Math.random() - 0.5) * 30}vw`,
        rot: `${Math.random() * 900 - 450}deg`,
        color: COLORS[i % COLORS.length],
        w: 6 + Math.random() * 6,
        round: Math.random() > 0.6,
      })),
    [count],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0"
          style={
            {
              left: `${p.left}%`,
              width: p.w,
              height: p.round ? p.w : p.w * 1.6,
              background: p.color,
              borderRadius: p.round ? 999 : 2,
              animation: `confetti-fall ${p.dur}s cubic-bezier(.25,.6,.4,1) ${p.delay}s forwards`,
              "--dx": p.dx,
              "--rot": p.rot,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

export interface CelebrationProps {
  title: string;
  subtitle?: string;
  band?: number | null;
  /** A CEFR level to show instead of the band (General English learners). */
  level?: string;
  xp: number;
  streak: number;
  streakExtended?: boolean;
  freezeEarned?: boolean;
  vocabAdded?: number;
  nextHref: string;
  nextTitle: string;
  onClose?: () => void;
  big?: boolean;
}

export function Celebration(p: CelebrationProps) {
  const { t, plural } = useT();
  const btn = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    btn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && p.onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [p]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="celebration-title">
      <div className="absolute inset-0" style={{ background: "rgb(12 18 32 / 0.55)" }} onClick={p.onClose} />
      <Confetti count={p.big ? 140 : 70} />
      <div className="card animate-pop relative w-full max-w-md overflow-hidden text-center">
        <div className="px-6 pb-6 pt-8" style={{ background: "var(--brand-soft)" }}>
          <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-[10px] " style={{ background: "var(--highlighter)", color: "var(--on-highlighter)" }}>
            <Icon name={p.big ? "trophy" : "star"} size={30} />
          </div>
          <h2 id="celebration-title" className="font-display text-3xl">
            {p.title}
          </h2>
          {p.subtitle && (
            <p className="mt-1" style={{ color: "var(--muted)" }}>
              {p.subtitle}
            </p>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 px-6 py-5">
          <Stat icon="star" color="var(--gold)" value={`+${p.xp}`} label={t("celebration.xp")} />
          <Stat icon="flame" color="var(--brand)" value={String(p.streak)} label={p.streakExtended ? t("celebration.streakPlus") : t("celebration.dayStreak")} />
          <Stat icon="target" color="var(--listening)" value={p.level ?? (p.band != null ? p.band.toFixed(1) : "—")} label={t(p.level ? "celebration.level" : "celebration.band")} />
        </div>
        {(p.vocabAdded || p.freezeEarned) ? (
          <div className="mx-6 mb-4 space-y-1 rounded-md p-3 text-sm font-semibold" style={{ background: "var(--surface-2)" }}>
            {!!p.vocabAdded && <p>{plural("celebration.newWords", p.vocabAdded)}</p>}
            {p.freezeEarned && <p>{t("celebration.freeze")}</p>}
          </div>
        ) : null}
        <div className="flex flex-col gap-2 px-6 pb-6">
          <Link ref={btn} href={p.nextHref} className="btn btn-primary w-full">
            {p.nextTitle} <Icon name="arrow" size={18} />
          </Link>
          {p.onClose && (
            <button type="button" onClick={p.onClose} className="btn btn-ghost w-full">
              {t("celebration.review")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, color, value, label }: { icon: string; color: string; value: string; label: string }) {
  return (
    <div className="rounded-[10px] p-3" style={{ background: "var(--surface-2)" }}>
      <Icon name={icon} size={20} style={{ color, margin: "0 auto" }} />
      <div className="num mt-1 text-2xl font-bold">{value}</div>
      <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
        {label}
      </div>
    </div>
  );
}
