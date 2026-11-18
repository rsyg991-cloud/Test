"use client";

import { useState, useTransition } from "react";
import { changePlan } from "@/app/actions/study";
import { Icon } from "@/components/icons";
import { PLANS } from "@/lib/plan/scheduler";

export function PlanEditor({ months, target, examDate }: { months: number; target: number; examDate: string | null }) {
  const [m, setM] = useState(months);
  const [t, setT] = useState(target);
  const [d, setD] = useState(examDate ?? "");
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const dirty = m !== months || t !== target || (d || null) !== examDate;

  return (
    <div className="card p-5 sm:p-6">
      <h2 className="font-display text-xl font-bold">Adjust your plan</h2>
      <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
        Changing your plan keeps all your progress — we simply re-pace what&apos;s left.
      </p>
      <div className="mt-5 flex flex-wrap gap-2" role="radiogroup" aria-label="Plan length">
        {PLANS.map((p) => (
          <button
            key={p.months}
            type="button"
            role="radio"
            aria-checked={m === p.months}
            onClick={() => setM(p.months)}
            className="rounded-2xl border-2 px-4 py-2.5 text-left"
            style={{ borderColor: m === p.months ? "var(--brand)" : "var(--line)", background: m === p.months ? "var(--brand-soft)" : "transparent" }}
          >
            <div className="font-bold">
              {p.months} {p.months === 1 ? "month" : "months"}
            </div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              {p.name} · {p.dailyMinutes} min/day
            </div>
          </button>
        ))}
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">Target band</span>
          <select className="input" value={t} onChange={(e) => setT(Number(e.target.value))}>
            {[5.5, 6, 6.5, 7, 7.5, 8, 8.5].map((b) => (
              <option key={b} value={b}>
                {b.toFixed(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-bold">Exam date</span>
          <input type="date" className="input" value={d} onChange={(e) => setD(e.target.value)} />
        </label>
      </div>
      <div className="mt-5 flex items-center justify-end gap-3">
        {saved && !dirty && (
          <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--success)" }}>
            <Icon name="check" size={16} /> Saved
          </span>
        )}
        <button
          type="button"
          className="btn btn-primary"
          disabled={!dirty || pending}
          onClick={() =>
            start(async () => {
              await changePlan(m, t, d || null);
              setSaved(true);
            })
          }
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
