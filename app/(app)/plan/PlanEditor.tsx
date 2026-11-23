"use client";

import { useState, useTransition } from "react";
import { changePlan } from "@/app/actions/study";
import { Icon } from "@/components/icons";
import { endStageFor, pathItemCount, TARGET_BANDS } from "@/content/stageList";
import { useT } from "@/lib/i18n/client";
import { paceLevel, PLANS } from "@/lib/plan/scheduler";

/**
 * `levels`: a General English learner (no IELTS goal) has no band target or exam date to set, and the
 * length of their path (`pathItems`) comes from their goals rather than from a target band.
 */
export function PlanEditor({
  months,
  target,
  examDate,
  startStage,
  levels = false,
  pathItems,
}: {
  months: number;
  target: number;
  examDate: string | null;
  startStage: number;
  levels?: boolean;
  pathItems?: number;
}) {
  const { t: tr, plural, planText } = useT();
  const [m, setM] = useState(months);
  const [t, setT] = useState(target);
  const [d, setD] = useState(examDate ?? "");
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const pace = paceLevel(m, levels && pathItems ? pathItems : pathItemCount(startStage, endStageFor(t)));
  const dirty = m !== months || t !== target || (d || null) !== examDate;

  return (
    <div className="card p-5 sm:p-6">
      <h2 className="font-display text-xl">{tr("plan.adjust")}</h2>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
        {tr("plan.adjustBody")}
      </p>
      <div className="mt-5 flex flex-wrap gap-2" role="radiogroup" aria-label={tr("plan.lengthLabel")}>
        {PLANS.map((p) => (
          <button
            key={p.months}
            type="button"
            role="radio"
            aria-checked={m === p.months}
            onClick={() => setM(p.months)}
            className="rounded-[10px] border-2 px-4 py-2.5 text-start"
            style={{ borderColor: m === p.months ? "var(--brand)" : "var(--line)", background: m === p.months ? "var(--brand-soft)" : "transparent" }}
          >
            <div className="font-bold">{plural("common.month", p.months)}</div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              {tr("plan.minPerDay", { name: planText(p.months, "name"), minutes: p.dailyMinutes })}
            </div>
          </button>
        ))}
      </div>
      {pace && (
        <p className="mt-4 rounded-md px-3 py-2 text-sm font-semibold" role="status" style={{ background: "var(--brand-soft)", color: "var(--ink)" }}>
          {tr(`pace.${pace.level}`, { n: pace.n })}
        </p>
      )}
      {levels ? (
        <p className="mt-5 text-sm" style={{ color: "var(--muted)" }}>
          {tr("plan.generalNote")}
        </p>
      ) : (
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">{tr("plan.targetBand")}</span>
          <select className="input" value={t} onChange={(e) => setT(Number(e.target.value))}>
            {TARGET_BANDS.map((b) => (
              <option key={b} value={b}>
                {b.toFixed(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">{tr("plan.examDate")}</span>
          <input type="date" className="input" value={d} onChange={(e) => setD(e.target.value)} />
        </label>
      </div>
      )}
      <div className="mt-5 flex items-center justify-end gap-3">
        {saved && !dirty && (
          <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--success)" }}>
            <Icon name="check" size={16} /> {tr("common.saved")}
          </span>
        )}
        <button
          type="button"
          className="btn btn-primary"
          disabled={!dirty || pending}
          onClick={() =>
            start(async () => {
              await changePlan(m, levels ? undefined : t, levels ? null : d || null);
              setSaved(true);
            })
          }
        >
          {pending ? tr("common.saving") : tr("common.save")}
        </button>
      </div>
    </div>
  );
}
