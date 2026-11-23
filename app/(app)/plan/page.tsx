import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import Link from "next/link";
import { catchUp } from "@/app/actions/study";
import { Icon } from "@/components/icons";
import { PageHeader, ProgressBar, SKILL_META } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { addDays } from "@/lib/dates";
import { getPlan, isReviewDay, scheduleItems } from "@/lib/plan/scheduler";
import { getTodayPlan } from "@/lib/progress";
import { PlanEditor } from "./PlanEditor";
import { showsLevels } from "@/content/goals";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("meta.plan") };
}

export default async function PlanPage() {
  const user = await requireUser();
  const { t, plural, planText, stage, formatDate } = await getT();
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
      <PageHeader
        eyebrow={t("plan.eyebrow")}
        title={t("plan.title", { name: planText(plan.months, "name", showsLevels(user.goals)), months: plural("common.month", plan.months) })}
        subtitle={planText(plan.months, "bestFor", showsLevels(user.goals))}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="eyebrow">{t("plan.timeline")}</div>
          <div className="mt-1 font-bold">
            {formatDate(planStart)} <span className="inline-block rtl:-scale-x-100">→</span> {formatDate(today.endDate)}
          </div>
          <div className="mt-3">
            <ProgressBar value={Math.min(1, today.dayNumber / today.totalDays)} label={t("plan.timeElapsed")} />
          </div>
          <div className="mt-1 text-xs font-semibold" style={{ color: "var(--muted)" }}>
            {t("plan.dayOf", { day: Math.min(today.dayNumber, today.totalDays), total: today.totalDays })}
          </div>
        </div>
        <div className="card p-5">
          <div className="eyebrow">{t("plan.curriculum")}</div>
          <div className="mt-1 font-bold">{t("plan.doneOf", { done, total: items.length })}</div>
          <div className="mt-3">
            <ProgressBar value={done / items.length} color="var(--success)" label={t("plan.curriculumDone")} />
          </div>
          <div className="mt-1 text-xs font-semibold" style={{ color: today.behind > 0 ? "var(--writing)" : "var(--success)" }}>
            {today.behind > 0 ? t("plan.behindSchedule", { n: today.behind }) : t("plan.onTrack")}
          </div>
        </div>
        <div className="card p-5">
          <div className="eyebrow">{t("plan.commitment")}</div>
          <div className="mt-1 font-display text-3xl">{t("common.minutesShort", { n: plan.dailyMinutes })}</div>
          <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
            {t("plan.commitmentNote")}
          </div>
        </div>
      </div>

      {examTooEarly && (
        <div className="card flex items-center gap-3 p-4" style={{ borderColor: "var(--danger)" }}>
          <Icon name="calendar" size={20} style={{ color: "var(--danger)" }} />
          <p className="text-sm font-semibold">
            {t("plan.endsAfterExam", { date: formatDate(user.examDate!) })}
          </p>
        </div>
      )}

      {today.behind > 0 && (
        <form action={catchUp} className="card flex flex-wrap items-center gap-3 p-4">
          <Icon name="refresh" size={20} style={{ color: "var(--writing)" }} />
          <p className="flex-1 text-sm font-semibold">{plural("plan.catchUpBody", today.behind)}</p>
          <button className="btn btn-dark px-4 py-2">{t("plan.catchUp")}</button>
        </form>
      )}

      <section className="card p-5 sm:p-6">
        <h2 className="mb-4 font-display text-xl">{t("plan.nextTwoWeeks")}</h2>
        <ol className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
          {upcoming.map((d, k) => (
            <li key={d.dayIndex} className="flex gap-3 rounded-[10px] p-3" style={{ background: k === 0 ? "var(--brand-soft)" : "var(--surface-2)" }}>
              <div className="w-14 shrink-0 text-center">
                <div className="text-[11px] font-bold uppercase" style={{ color: "var(--muted)" }}>
                  {formatDate(d.date, { weekday: "short" })}
                </div>
                <div className="num text-xl font-bold">{d.date.getUTCDate()}</div>
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                {d.items.length === 0 ? (
                  <div className="pt-1 text-sm font-semibold" style={{ color: "var(--muted)" }}>
                    {isReviewDay(d.dayIndex) ? t("plan.reviewDay") : t("plan.drillsDay")}
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
                      <span className="truncate" dir="auto">
                        {item.kind === "lesson" ? item.lesson.title : t("journey.checkpointTitle", { camp: stage(item.stage, "camp") })}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <PlanEditor levels={showsLevels(user.goals)} pathItems={items.length} startStage={user.startStage} months={plan.months} target={user.targetBand ?? 7} examDate={user.examDate ? user.examDate.toISOString().slice(0, 10) : null} />
    </div>
  );
}
