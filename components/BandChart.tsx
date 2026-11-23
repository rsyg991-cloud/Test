"use client";

import { useT } from "@/lib/i18n/client";
import type { Skill } from "@/content/types";
import { CEFR_STEPS, cefrForBand } from "@/lib/scoring";
import { SKILL_META } from "./ui";

interface Point {
  skill: string;
  band: number;
  createdAt: Date;
}

/**
 * Band-over-time chart: one line per skill plus the learner's target. With `levels` (General English
 * learners) the axis is labelled with CEFR levels at their thresholds instead of band numbers.
 */
export function BandChart({ snapshots, target, height = 240, levels = false }: { snapshots: Point[]; target: number | null; height?: number; levels?: boolean }) {
  const { t, formatDate } = useT();
  const W = 640;
  const H = height;
  const pad = { l: 34, r: 14, t: 14, b: 26 };
  const skills: Skill[] = ["reading", "listening", "writing", "speaking"];
  const sorted = [...snapshots].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  if (sorted.length < 2) {
    return (
      <div className="grid place-items-center rounded-[10px] p-8 text-center text-sm" style={{ background: "var(--surface-2)", color: "var(--muted)", minHeight: 160 }}>
        {t(levels ? "chart.emptyLevels" : "chart.empty")}
      </div>
    );
  }

  const minB = Math.max(1, Math.floor(Math.min(...sorted.map((s) => s.band), target ?? 9) - 0.5));
  const maxB = Math.min(9, Math.ceil(Math.max(...sorted.map((s) => s.band), target ?? 0) + 0.5));
  const t0 = sorted[0].createdAt.getTime();
  const t1 = Math.max(t0 + 1, sorted[sorted.length - 1].createdAt.getTime());
  const x = (t: number) => pad.l + ((t - t0) / (t1 - t0)) * (W - pad.l - pad.r);
  const y = (b: number) => pad.t + (1 - (b - minB) / (maxB - minB)) * (H - pad.t - pad.b);
  const ticks: number[] = [];
  if (levels) for (const [, at] of CEFR_STEPS) if (at >= minB && at <= maxB) ticks.push(at);
  if (!levels) for (let b = minB; b <= maxB; b += maxB - minB > 4 ? 1 : 0.5) ticks.push(b);

  return (
    <figure dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={t(levels ? "chart.labelLevels" : "chart.label")}>
        {ticks.map((b) => (
          <g key={b}>
            <line x1={pad.l} x2={W - pad.r} y1={y(b)} y2={y(b)} stroke="var(--line)" strokeDasharray="3 5" />
            <text x={pad.l - 8} y={y(b) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">
              {levels ? cefrForBand(b) : b.toFixed(1)}
            </text>
          </g>
        ))}
        {target && target <= maxB && (
          <g>
            <line x1={pad.l} x2={W - pad.r} y1={y(target)} y2={y(target)} stroke="var(--brand)" strokeWidth="2" strokeDasharray="8 6" />
            <text x={W - pad.r} y={y(target) - 6} textAnchor="end" fontSize="11" fontWeight="700" fill="var(--brand)">
              {t("chart.target", { band: target.toFixed(1) })}
            </text>
          </g>
        )}
        {skills.map((s) => {
          const pts = sorted.filter((p) => p.skill === s);
          if (pts.length === 0) return null;
          const d = pts.map((p, i) => `${i ? "L" : "M"}${x(p.createdAt.getTime()).toFixed(1)},${y(p.band).toFixed(1)}`).join(" ");
          return (
            <g key={s}>
              <path d={d} fill="none" stroke={SKILL_META[s].color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              {pts.map((p, i) => (
                <circle key={i} cx={x(p.createdAt.getTime())} cy={y(p.band)} r="3.5" fill="var(--surface)" stroke={SKILL_META[s].color} strokeWidth="2">
                  <title>{t("chart.point", { skill: t(`skills.${s}`), band: levels ? cefrForBand(p.band) : p.band.toFixed(1), date: formatDate(p.createdAt) })}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-3 flex flex-wrap gap-4 text-xs font-semibold" style={{ color: "var(--muted)" }}>
        {skills.map((s) => (
          <span key={s} className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: SKILL_META[s].color }} />
            {t(`skills.${s}`)}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
