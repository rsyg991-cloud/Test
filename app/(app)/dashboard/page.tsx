import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { catchUp } from "@/app/actions/study";
import { flags } from "@/lib/flags";
import { conversations, practicePrompts, SKILLS, type Skill } from "@/content";
import { BandChart } from "@/components/BandChart";
import { Icon } from "@/components/icons";
import { JourneyMap } from "@/components/JourneyMap";
import { BandPill, ProgressBar, Ring, SKILL_META, SkillBadge, SkillIcon } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addDays, dayKey } from "@/lib/dates";
import { getPlan } from "@/lib/plan/scheduler";
import { getSkillBands, getTodayPlan, stageProgress } from "@/lib/progress";
import { cefrForBand, nextCefr } from "@/lib/scoring";
import { showsLevels } from "@/content/goals";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("meta.dashboard") };
}

/** Morning / afternoon / evening. Arabic users are mostly in the Gulf (UTC+3). */
const greetingKey = (locale: string) => {
  const h = (new Date().getUTCHours() + (locale === "ar" ? 3 : 0)) % 24;
  return h < 12 ? ("dashboard.morning" as const) : h < 18 ? ("dashboard.afternoon" as const) : ("dashboard.evening" as const);
};

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const user = await requireUser();
  // A learner still in Stage 0 has nothing open in Stage 1 yet: their "today" is Stage 0.
  if (user.unlockedStage === 0) redirect(flags.stage0() ? "/starter" : "/journey");
  const { t, plural, planText, stage, formatDate, locale } = await getT();
  const [{ items, today, completedIds }, { bands, overall, snapshots }, activity, vocabDue, convDone] = await Promise.all([
    getTodayPlan(user),
    getSkillBands(user.id),
    prisma.activityDay.findMany({ where: { userId: user.id, day: { gte: dayKey(addDays(new Date(), -27)) } } }),
    prisma.vocabCard.count({ where: { userId: user.id, due: { lte: new Date() } } }),
    prisma.attempt.findMany({ where: { userId: user.id, kind: "conversation-complete" }, select: { refId: true } }),
  ]);

  const plan = getPlan(user.planMonths);
  const todayAct = activity.find((a) => a.day === dayKey());
  const minutesToday = todayAct?.minutes ?? 0;
  const goalPct = Math.min(1, minutesToday / plan.dailyMinutes);
  const due = today.dueIndices.map((i) => items[i]);
  const stagesP = stageProgress(completedIds, user.unlockedStage, user);
  const overallProgress = items.filter((i) => completedIds.has(i.id)).length / items.length;
  // General English learners (no IELTS goal) see a CEFR level, never a band or band target.
  const levels = showsLevels(user.goals);
  const target = levels ? null : (user.targetBand ?? 7);
  const next = nextCefr(overall);
  const weakest = (SKILLS.filter((s) => bands[s] !== null) as Skill[]).sort((a, b) => (bands[a] ?? 9) - (bands[b] ?? 9))[0];
  const practiceSkill: "writing" | "speaking" = weakest === "speaking" ? "speaking" : "writing";
  const practice = practicePrompts.filter((p) => p.stage <= user.unlockedStage && p.skill === practiceSkill);
  const suggestedPractice = practice[(new Date().getUTCDate() + user.xp) % Math.max(1, practice.length)];
  // Conversation of the day: the first one not yet done, from the highest unlocked stage downwards.
  const doneConv = new Set(convDone.map((c) => c.refId));
  const conversation =
    [...conversations].sort((a, b) => b.stage - a.stage).find((c) => c.stage <= user.unlockedStage && !doneConv.has(c.id)) ??
    ((open) => open[new Date().getUTCDate() % Math.max(1, open.length)])(conversations.filter((c) => c.stage <= user.unlockedStage));
  const examDays = user.examDate ? Math.ceil((user.examDate.getTime() - Date.now()) / 86_400_000) : null;
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i - 6));

  return (
    <div className="space-y-6">
      {welcome && (
        <div className="animate-rise rounded-[16px] p-5 " style={{ background: "var(--highlighter)", color: "var(--on-highlighter)" }}>
          <div className="flex items-center gap-3">
            <Icon name="mountain" size={26} />
            <div>
              <div className="font-display text-xl">{t("dashboard.planReady", { plan: planText(plan.months, "name") })}</div>
              <div className="opacity-90">{t("dashboard.planReadyBody")}</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">
            {t("dashboard.dayOf", { day: Math.min(today.dayNumber, today.totalDays), total: today.totalDays, plan: planText(plan.months, "name") })}
          </div>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl">{t("dashboard.greeting", { greeting: t(greetingKey(locale)), name: user.name })}</h1>
        </div>
        {examDays !== null && examDays >= 0 && (
          <div className="card flex items-center gap-3 px-4 py-2.5">
            <Icon name="calendar" size={18} style={{ color: "var(--brand)" }} />
            <span className="text-sm font-bold">{examDays === 0 ? t("dashboard.examToday") : plural("dashboard.examIn", examDays)}</span>
          </div>
        )}
      </div>

      {examDays !== null && examDays >= 0 && examDays <= 30 && (
        <Link href="/practice#mock-tests" className="card flex flex-wrap items-center gap-4 p-4 transition-transform hover:-translate-y-0.5">
          <span className="grid h-10 w-10 place-items-center rounded-md text-white" style={{ background: "var(--navy)" }}>
            <Icon name="trophy" size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-bold">{plural("dashboard.mockNudge", examDays)}</div>
            <div className="text-sm" style={{ color: "var(--muted)" }}>{t("dashboard.mockNudgeBody")}</div>
          </div>
          <Icon name="arrow" size={18} />
        </Link>
      )}

      {today.behind >= 2 && (
        <div className="card flex flex-wrap items-center gap-4 p-4" style={{ borderColor: "var(--gold)" }}>
          <span className="grid h-10 w-10 place-items-center rounded-md" style={{ background: "color-mix(in srgb, var(--gold) 20%, transparent)", color: "var(--writing)" }}>
            <Icon name="refresh" size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-bold">{plural("dashboard.behind", today.behind)}</div>
            <div className="text-sm" style={{ color: "var(--muted)" }}>
              {t("dashboard.behindBody")}
            </div>
          </div>
          <form action={catchUp}>
            <button className="btn btn-dark">{t("dashboard.catchUp")}</button>
          </form>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        {/* Today's session */}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between gap-4 p-5 sm:p-6" style={{ background: "var(--brand-soft)" }}>
            <div>
              <div className="eyebrow" style={{ color: "var(--brand)" }}>
                {today.finished
                  ? t("dashboard.journeyComplete")
                  : today.reviewDay
                    ? t("dashboard.reviewDay")
                    : today.aheadMode
                      ? t("dashboard.onTrack")
                      : t("dashboard.todaysSession")}
              </div>
              <h2 className="mt-1 font-display text-2xl">
                {today.finished
                  ? t("dashboard.summit")
                  : today.reviewDay && due.length === 0
                    ? t("dashboard.lightDay")
                    : today.aheadMode
                      ? t("dashboard.getAhead")
                      : plural("dashboard.tasksToday", due.length)}
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                {t("dashboard.dailyGoal", { goal: plan.dailyMinutes, done: minutesToday })}
              </p>
            </div>
            <Ring value={goalPct} size={84} stroke={9} label={t("dashboard.goalLabel", { pct: Math.round(goalPct * 100) })}>
              <div>
                <div className="num text-lg font-bold leading-none">{Math.round(goalPct * 100)}%</div>
                <div className="text-[10px] font-bold uppercase" style={{ color: "var(--muted)" }}>
                  {t("dashboard.goal")}
                </div>
              </div>
            </Ring>
          </div>

          <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
            {due.map((item, i) => {
              const href = item.kind === "lesson" ? `/learn/${item.id}` : `/checkpoint/${item.stage}`;
              const locked = item.stage > user.unlockedStage;
              return (
                <li key={item.id} style={{ borderColor: "var(--line)" }}>
                  <Link href={locked ? "/journey" : href} className="group flex items-center gap-4 p-4 transition-colors hover:bg-[var(--surface-2)] sm:px-6">
                    {item.kind === "lesson" ? (
                      <SkillIcon skill={item.lesson.skill} />
                    ) : (
                      <span className="grid h-11 w-11 place-items-center rounded-[10px] text-white" style={{ background: "var(--navy)" }}>
                        <Icon name="trophy" size={20} />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold" dir="auto">
                        {item.kind === "lesson" ? item.lesson.title : t("dashboard.checkpointTitle", { camp: stage(item.stage, "camp") })}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-semibold" style={{ color: "var(--muted)" }}>
                        {item.kind === "lesson" ? (
                          <>
                            <SkillBadge skill={item.lesson.skill} /> {t("dashboard.lessonMeta", { minutes: item.lesson.minutes, xp: item.lesson.xp })}
                          </>
                        ) : (
                          <span>{t("dashboard.checkpointMeta", { n: item.stage })}</span>
                        )}
                      </div>
                    </div>
                    {i === 0 ? (
                      <span className="btn btn-primary animate-pulse-ring hidden px-4 py-2 sm:inline-flex">
                        {t("common.start")} <Icon name="play" size={14} className="rtl:-scale-x-100" />
                      </span>
                    ) : (
                      <Icon name="arrow" size={18} style={{ color: "var(--muted)" }} />
                    )}
                  </Link>
                </li>
              );
            })}
            {vocabDue > 0 && (
              <li style={{ borderColor: "var(--line)" }}>
                <Link href="/vocab" className="flex items-center gap-4 p-4 transition-colors hover:bg-[var(--surface-2)] sm:px-6">
                  <span className="grid h-11 w-11 place-items-center rounded-[10px]" style={{ background: "color-mix(in srgb, var(--gold) 18%, transparent)", color: "var(--writing)" }}>
                    <Icon name="cards" size={20} />
                  </span>
                  <div className="flex-1">
                    <div className="font-bold">{t("dashboard.vocabReview")}</div>
                    <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                      {plural("dashboard.vocabMeta", vocabDue, { min: Math.max(2, Math.ceil(vocabDue / 3)) })}
                    </div>
                  </div>
                  <Icon name="arrow" size={18} style={{ color: "var(--muted)" }} />
                </Link>
              </li>
            )}
            {conversation && (
              <li style={{ borderColor: "var(--line)" }}>
                <Link href={`/conversations/${conversation.id}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-[var(--surface-2)] sm:px-6">
                  <span className="grid h-11 w-11 place-items-center rounded-[10px] text-[var(--on-skill)]" style={{ background: "var(--speaking)" }}>
                    <Icon name="mic" size={20} />
                  </span>
                  <div className="flex-1">
                    <div className="font-bold">{t("dashboard.talkWithAi", { title: conversation.title })}</div>
                    <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                      {t("dashboard.talkMeta", { minutes: conversation.minutes, xp: conversation.xp })}
                    </div>
                  </div>
                  <Icon name="arrow" size={18} style={{ color: "var(--muted)" }} />
                </Link>
              </li>
            )}
            {suggestedPractice && (
              <li style={{ borderColor: "var(--line)" }}>
                <Link href={`/practice/${suggestedPractice.id}`} className="flex items-center gap-4 p-4 transition-colors hover:bg-[var(--surface-2)] sm:px-6">
                  <SkillIcon skill={suggestedPractice.skill} />
                  <div className="flex-1">
                    <div className="font-bold">{t("dashboard.bonusDrill", { title: suggestedPractice.title })}</div>
                    <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                      {t("dashboard.bonusMeta", { skill: locale === "en" ? t(`skills.${suggestedPractice.skill}`).toLowerCase() : t(`skills.${suggestedPractice.skill}`) })}
                    </div>
                  </div>
                  <Icon name="arrow" size={18} style={{ color: "var(--muted)" }} />
                </Link>
              </li>
            )}
          </ul>
        </section>

        {/* Streak + band */}
        <div className="grid gap-6">
          <section className="card p-5">
            <div className="flex items-center gap-4">
              <span className={`grid h-14 w-14 place-items-center rounded-[10px] ${user.streak > 0 ? "animate-flame" : ""}`} style={{ background: user.streak > 0 ? "var(--brand)" : "var(--surface-2)", color: user.streak > 0 ? "var(--brand-ink)" : "var(--muted)" }}>
                <Icon name="flame" size={28} />
              </span>
              <div className="flex-1">
                <div className="font-display text-3xl leading-none">{plural("dashboard.streakDays", user.streak)}</div>
                <div className="mt-1 text-sm font-semibold" style={{ color: "var(--muted)" }}>
                  {todayAct ? t("dashboard.streakSecured") : user.streak > 0 ? t("dashboard.keepAlive") : t("dashboard.startStreak")}
                </div>
              </div>
              <div className="text-end text-xs font-semibold" style={{ color: "var(--muted)" }}>
                {plural("dashboard.freezes", user.streakFreezes)}
                <br />
                {t("dashboard.best", { n: user.longestStreak })}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-7 gap-1.5">
              {weekDays.map((d) => {
                const a = activity.find((x) => x.day === dayKey(d));
                const isToday = dayKey(d) === dayKey();
                return (
                  <div key={dayKey(d)} className="text-center">
                    <div className="text-[11px] font-bold" style={{ color: "var(--muted)" }}>
                      {formatDate(d, { weekday: "narrow" })}
                    </div>
                    <div
                      className="mx-auto mt-1 grid h-8 w-8 place-items-center rounded-full"
                      style={{ background: a ? "var(--brand)" : "var(--surface-2)", color: "var(--brand-ink)", outline: isToday ? "2px solid var(--brand)" : undefined, outlineOffset: 2 }}
                      title={a ? t("dashboard.dayActivity", { minutes: a.minutes, xp: a.xp }) : t("dashboard.noActivity")}
                    >
                      {a && <Icon name="check" size={14} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="card p-5">
            <div className="flex items-start justify-between gap-3">
              {levels ? (
                <div>
                  <div className="eyebrow">{t("dashboard.estimatedLevel")}</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="num text-5xl font-bold" dir="ltr">
                      {overall === null ? "—" : cefrForBand(overall)}
                    </span>
                    {next && (
                      <span className="font-bold" style={{ color: "var(--muted)" }}>
                        {t("dashboard.nextLevel", { cefr: next })}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="eyebrow">{t("dashboard.estimatedOverall")}</div>
                  <div className="mt-1 flex items-baseline gap-2" dir="ltr">
                    <span className="num text-5xl font-bold">{overall?.toFixed(1) ?? "—"}</span>
                    <span className="font-bold" style={{ color: "var(--muted)" }}>
                      {cefrForBand(overall)}
                    </span>
                  </div>
                </div>
              )}
              <div className="text-end">
                <div className="eyebrow">{t("dashboard.target")}</div>
                {target === null ? (
                  <span className="inline-block rounded-md px-2.5 py-0.5 text-sm font-bold" style={{ background: "var(--surface-2)" }}>
                    {t("dashboard.goalGeneral")}
                  </span>
                ) : (
                  <BandPill band={target} />
                )}
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {SKILLS.map((s) => (
                <div key={s} className="flex items-center gap-3">
                  <span className="w-20 text-sm font-semibold">{t(`skills.${s}`)}</span>
                  <div className="relative flex-1">
                    <ProgressBar value={(bands[s] ?? 0) / 9} color={SKILL_META[s].color} height={10} label={t(levels ? "dashboard.skillLevel" : "dashboard.skillBand", { skill: t(`skills.${s}`) })} />
                    {target !== null && (
                      <span className="absolute top-[-3px] h-4 w-0.5 rounded" style={{ insetInlineStart: `${(target / 9) * 100}%`, background: "var(--ink)" }} aria-hidden="true" />
                    )}
                  </div>
                  <span className="num w-8 text-end font-bold" dir="ltr">
                    {levels ? (bands[s] === null ? "—" : cefrForBand(bands[s])) : (bands[s]?.toFixed(1) ?? "—")}
                  </span>
                </div>
              ))}
            </div>
            <Link href="/progress" className="mt-4 inline-flex items-center gap-1 text-sm font-bold" style={{ color: "var(--brand)" }}>
              {t("dashboard.seeProgress")} <Icon name="arrow" size={14} />
            </Link>
          </section>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.45fr]">
        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="font-display text-xl">{t("dashboard.yourJourney")}</h2>
            <span className="text-sm font-bold" style={{ color: "var(--muted)" }}>
              {t("dashboard.climbed", { pct: Math.round(overallProgress * 100) })}
            </span>
          </div>
          <JourneyMap stages={stagesP} compact />
          <Link href="/journey" className="btn btn-ghost mt-4 w-full">
            {t("dashboard.openMap")}
          </Link>
        </section>
        <section className="card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl">{t(levels ? "dashboard.skillTrend" : "dashboard.bandTrend")}</h2>
            <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
              {t("dashboard.planEnds", { date: formatDate(today.endDate) })}
            </span>
          </div>
          <BandChart snapshots={snapshots} target={target} levels={levels} />
        </section>
      </div>
    </div>
  );
}
