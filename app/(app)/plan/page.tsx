import type { Metadata } from "next";
import Link from "next/link";
import { catchUp } from "@/app/actions/study";
import { Icon } from "@/components/icons";
import { PageHeader, ProgressBar, SKILL_META } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { addDays, formatDate } from "@/lib/dates";
import { getPlan, isReviewDay, scheduleItems } from "@/lib/plan/scheduler";
import { getTodayPlan } from "@/lib/progress";
import { PlanEditor } from "./PlanEditor";

export const metadata: Metadata = { title: "My plan" };

export default async function PlanPage() {
  const user = await requireUser();
  const { items, completed, today } = await getTodayPlan(user);
  const plan = getPlan(user.planMonths);
  const schedule = scheduleItems(plan.months, items.length);
  const planStart = user.planStart ?? new Date();
  const done = completed.filter(Boolean).length;
  const examTooEarly = user.examDate && today.endDate > user.examDate;

  // Upcoming 14 days from today.
  const upcoming = Array.from({ length: 14 }, (_, k) => {
    const dayIndex = today.dayIndex + k;
    const idxs = schedule.map((d, i) => (d === dayIndex ? i : -1)).filter((i) => i >= 0);
    return { date: addDays(planStart, dayIndex), dayIndex, items: idxs.map((i) => ({ item: items[i], done: completed[i] })) };
  }).filter((d) => d.dayIndex < today.totalDays);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Study plan" title={`${plan.name} · ${plan.months} ${plan.months === 1 ? "month" : "months"}`} subtitle={plan.bestFor} />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="eyebrow">Timeline</div>
          <div className="mt-1 font-bold">
            {formatDate(planStart)} → {formatDate(today.endDate)}
          </div>
          <div className="mt-3">
            <ProgressBar value={Math.min(1, today.dayNumber / today.totalDays)} label="Time elapsed" />
          </div>
          <div className="mt-1 text-xs font-semibold" style={{ color: "var(--muted)" }}>
            Day {Math.min(today.dayNumber, today.totalDays)} of {today.totalDays}
          </div>
        </div>
        <div className="card p-5">
          <div className="eyebrow">Curriculum</div>
          <div className="mt-1 font-bold">
            {done} of {items.length} completed
          </div>
          <div className="mt-3">
            <ProgressBar value={done / items.length} color="var(--success)" label="Curriculum completed" />
          </div>
          <div className="mt-1 text-xs font-semibold" style={{ color: today.behind > 0 ? "var(--writing)" : "var(--success)" }}>
            {today.behind > 0 ? `${today.behind} behind schedule` : "On track ✓"}
          </div>
        </div>
        <div className="card p-5">
          <div className="eyebrow">Daily commitment</div>
          <div className="mt-1 font-display text-3xl font-bold">{plan.dailyMinutes} min</div>
          <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
            6 study days + 1 light review day each week
          </div>
        </div>
      </div>

      {examTooEarly && (
        <div className="card flex items-center gap-3 p-4" style={{ borderColor: "var(--danger)" }}>
          <Icon name="calendar" size={20} style={{ color: "var(--danger)" }} />
          <p className="text-sm font-semibold">
            Your plan ends after your exam ({formatDate(user.examDate!)}). Consider a shorter, more intensive plan below.
          </p>
        </div>
      )}

      {today.behind > 0 && (
        <form action={catchUp} className="card flex flex-wrap items-center gap-3 p-4">
          <Icon name="refresh" size={20} style={{ color: "var(--writing)" }} />
          <p className="flex-1 text-sm font-semibold">Behind schedule? Shift your plan so today is a fresh start. Your end date moves by {today.behind > 1 ? "a few days" : "a day"}.</p>
          <button className="btn btn-dark px-4 py-2">Catch up</button>
        </form>
      )}

      <section className="card p-5 sm:p-6">
        <h2 className="mb-4 font-display text-xl font-bold">Next two weeks</h2>
        <ol className="grid gap-2 sm:grid-cols-2">
          {upcoming.map((d, k) => (
            <li key={d.dayIndex} className="flex gap-3 rounded-2xl p-3" style={{ background: k === 0 ? "var(--brand-soft)" : "var(--surface-2)" }}>
              <div className="w-14 shrink-0 text-center">
                <div className="text-[11px] font-bold uppercase" style={{ color: "var(--muted)" }}>
                  {d.date.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })}
                </div>
                <div className="font-display text-xl font-bold">{d.date.getUTCDate()}</div>
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                {d.items.length === 0 ? (
                  <div className="pt-1 text-sm font-semibold" style={{ color: "var(--muted)" }}>
                    {isReviewDay(d.dayIndex) ? "Review day · vocab + one drill" : "Practice drills + vocab review"}
                  </div>
                ) : (
                  d.items.map(({ item, done }) => (
                    <Link
                      key={item.id}
                      href={item.kind === "lesson" ? `/learn/${item.id}` : `/checkpoint/${item.stage}`}
                      className="flex items-center gap-2 text-sm font-semibold"
                      style={{ textDecoration: done ? "line-through" : undefined, color: done ? "var(--muted)" : undefined }}
                    >
                      {item.kind === "lesson" ? (
                        <Icon name={SKILL_META[item.lesson.skill].icon} size={14} style={{ color: SKILL_META[item.lesson.skill].color, flexShrink: 0 }} />
                      ) : (
                        <Icon name="trophy" size={14} style={{ flexShrink: 0 }} />
                      )}
                      <span className="truncate">{item.kind === "lesson" ? item.lesson.title : item.checkpoint.title}</span>
                    </Link>
                  ))
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <PlanEditor months={plan.months} target={user.targetBand ?? 7} examDate={user.examDate ? user.examDate.toISOString().slice(0, 10) : null} />
    </div>
  );
}
