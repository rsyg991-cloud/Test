"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { Icon } from "./icons";

export interface StageProgress {
  id: number;
  name: string;
  camp: string;
  cefr: string;
  pct: number; // 0..1 lessons completed in the stage
  passed: boolean;
  locked: boolean;
  /** Below the learner's start stage. */
  skipped?: boolean;
  /** Inside the learner's path to their target band (default true). */
  inPlan?: boolean;
}

/**
 * The journey as an answer sheet read from the bottom up: one bubble per stage on ruled lines,
 * a track that fills as stages are passed, and the learner's current stage filled in.
 * Works for any number of stages (the curriculum ends at the learner's target stage).
 */
export function JourneyMap({ stages, compact = false }: { stages: StageProgress[]; compact?: boolean }) {
  const { t, stage } = useT();
  const n = Math.max(1, stages.length);
  // Overall position: passed stages count fully, the current stage by its lesson completion.
  let v = 0;
  for (const s of stages) {
    if (s.passed || s.skipped) v += 1;
    else {
      v += s.locked ? 0 : Math.min(0.95, s.pct);
      break;
    }
  }
  const currentIdx = stages.findIndex((s) => !s.passed && !s.locked && !s.skipped);
  const goalIdx = stages.reduce((g, s, i) => (s.inPlan !== false ? i : g), n - 1);
  const row = compact ? 52 : 64;
  const bubble = compact ? 36 : 44;
  // The track runs between the centres of the first and last bubbles.
  const fill = n === 1 ? (v >= 1 ? 1 : 0) : Math.min(1, v / (n - 1));

  return (
    <div className="ruled relative w-full overflow-hidden rounded-[16px] border px-4 py-4 sm:px-5" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
      <ol className="relative flex flex-col-reverse" aria-label={t("journeyMap.listLabel")}>
        <span
          aria-hidden="true"
          className="absolute rounded-full"
          style={{ insetInlineStart: bubble / 2 - 2, width: 4, bottom: row / 2, height: (n - 1) * row, background: "var(--surface-2)" }}
        />
        <span
          aria-hidden="true"
          className="absolute rounded-full transition-all duration-700"
          style={{ insetInlineStart: bubble / 2 - 2, width: 4, bottom: row / 2, height: (n - 1) * row * fill, background: "var(--brand)" }}
        />
        {stages.map((s, i) => {
          const isCurrent = i === currentIdx;
          const isGoal = i === goalIdx;
          const outside = s.inPlan === false;
          const bg = s.passed ? "var(--success)" : isCurrent ? "var(--brand)" : s.locked || s.skipped ? "var(--surface-2)" : "var(--surface)";
          const fg = s.passed ? "var(--on-skill)" : isCurrent ? "var(--brand-ink)" : "var(--muted)";
          return (
            <li key={s.id} className="relative flex items-center gap-3" style={{ height: row, opacity: outside && !s.passed && !s.skipped ? 0.6 : 1 }}>
              <Link
                href={`/journey#stage-${s.id}`}
                className="flex min-w-0 flex-1 items-center gap-3"
                aria-label={
                  t("journeyMap.aria", { n: s.id, name: stage(s.id, "name"), cefr: s.cefr }) +
                  (s.passed ? t("journeyMap.ariaCompleted") : s.skipped ? t("journeyMap.ariaSkipped") : s.locked ? t("journeyMap.ariaLocked") : isCurrent ? t("journeyMap.ariaHere") : "") +
                  (isGoal ? t("journeyMap.ariaGoal") : "")
                }
              >
                <span
                  className={`num relative grid shrink-0 place-items-center rounded-full border-2 text-base font-bold ${isCurrent ? "animate-pulse-ring" : ""}`}
                  style={{ width: bubble, height: bubble, background: bg, color: fg, borderColor: s.passed || isCurrent ? bg : "var(--line)" }}
                >
                  {s.passed ? <Icon name="check" size={18} strokeWidth={3} /> : isGoal && !isCurrent ? <Icon name="trophy" size={17} /> : s.locked ? <Icon name="lock" size={15} /> : s.id}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold leading-tight">{stage(s.id, "name")}</span>
                    {isCurrent && (
                      <span className="chip shrink-0" style={{ background: "var(--highlighter)", color: "var(--on-highlighter)" }}>
                        {t("journeyMap.youAreHere")}
                      </span>
                    )}
                    {isGoal && !isCurrent && (
                      <span className="chip shrink-0" style={{ background: "var(--surface-2)", color: "var(--ink)" }}>
                        {t("journeyMap.yourGoal")}
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-[11px] font-semibold" style={{ color: "var(--muted)" }}>
                    <span className="num" dir="ltr">
                      {s.cefr}
                    </span>
                    {s.skipped ? ` · ${t("journeyMap.skipped")}` : outside && !s.passed ? ` · ${t("journeyMap.beyondGoal")}` : !compact ? ` · ${stage(s.id, "camp")} · ` : ""}
                    {!compact && !s.skipped && !(outside && !s.passed) && <span className="num">{Math.round(s.pct * 100)}%</span>}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
