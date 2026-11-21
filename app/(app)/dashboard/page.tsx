import type { Metadata } from "next";
import Link from "next/link";
import { catchUp } from "@/app/actions/study";
import { conversations, practicePrompts, SKILLS, type Skill } from "@/content";
import { BandChart } from "@/components/BandChart";
import { Icon } from "@/components/icons";
import { JourneyMap } from "@/components/JourneyMap";
import { BandPill, ProgressBar, Ring, SKILL_META, SkillBadge, SkillIcon } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addDays, dayKey, formatDate } from "@/lib/dates";
import { getPlan } from "@/lib/plan/scheduler";
import { getSkillBands, getTodayPlan, stageProgress } from "@/lib/progress";
import { cefrForBand } from "@/lib/scoring";

export const metadata: Metadata = { title: "Today" };

const greeting = () => {
  const h = new Date().getUTCHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const user = await requireUser();
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
  const target = user.targetBand ?? 7;
  const weakest = (SKILLS.filter((s) => bands[s] !== null) as Skill[]).sort((a, b) => (bands[a] ?? 9) - (bands[b] ?? 9))[0];
  const practiceSkill: "writing" | "speaking" = weakest === "speaking" ? "speaking" : "writing";
  const practice = practicePrompts.filter((p) => p.stage <= user.unlockedStage && p.skill === practiceSkill);
  const suggestedPractice = practice[(new Date().getUTCDate() + user.xp) % Math.max(1, practice.length)];
  // Conversation of the day: the first one not yet done, from the highest unlocked stage downwards.
  const doneConv = new Set(convDone.map((c) => c.refId));
  const conversation =
    [...conversations].sort((a, b) => b.stage - a.stage).find((c) => c.stage <= user.unlockedStage && !doneConv.has(c.id)) ??
    conversations.filter((c) => c.stage <= user.unlockedStage)[new Date().getUTCDate() % 5];
  const examDays = user.examDate ? Math.ceil((user.examDate.getTime() - Date.now()) / 86_400_000) : null;
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i - 6));

  return (
    <div className="space-y-6">
      {welcome && (
        <div className="animate-rise rounded-[16px] p-5 " style={{ background: "var(--highlighter)", color: "var(--on-highlighter)" }}>
          <div className="flex items-center gap-3">
            <Icon name="mountain" size={26} />
            <div>
              <div className="font-display text-xl font-bold">Your {plan.months}-month plan is ready.</div>
              <div className="opacity-90">Day 1 starts now. Small steps, every day — you&apos;ve got this.</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow">
            Day {Math.min(today.dayNumber, today.totalDays)} of {today.totalDays} · {plan.name} plan
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            {greeting()}, {user.name}.
          </h1>
        </div>
        {examDays !== null && examDays >= 0 && (
          <div className="card flex items-center gap-3 px-4 py-2.5">
            <Icon name="calendar" size={18} style={{ color: "var(--brand)" }} />
            <span className="text-sm font-bold">{examDays === 0 ? "Exam day — good luck!" : `${examDays} days to your exam`}</span>
          </div>
        )}
      </div>

      {examDays !== null && examDays >= 0 && examDays <= 30 && (
        <Link href="/practice#mock-tests" className="card flex flex-wrap items-center gap-4 p-4 transition-transform hover:-translate-y-0.5">
          <span className="grid h-10 w-10 place-items-center rounded-md text-white" style={{ background: "var(--navy)" }}>
            <Icon name="trophy" size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-bold">Your exam is in {examDays} days — take a full mock test</div>
            <div className="text-sm" style={{ color: "var(--muted)" }}>The complete test with official timing shows exactly where you stand.</div>
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
            <div className="font-bold">You&apos;re {today.behind} lessons behind — that&apos;s okay.</div>
            <div className="text-sm" style={{ color: "var(--muted)" }}>
              Life happens. Reset your pace and we&apos;ll move the schedule so today is a fresh start.
            </div>
          </div>
          <form action={catchUp}>
            <button className="btn btn-dark">Build my catch-up plan</button>
          </form>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        {/* Today's session */}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between gap-4 p-5 sm:p-6" style={{ background: "var(--brand-soft)" }}>
            <div>
              <div className="eyebrow" style={{ color: "var(--brand)" }}>
                {today.finished ? "Journey complete" : today.reviewDay ? "Review day" : today.aheadMode ? "You're on track" : "Today's session"}
              </div>
              <h2 className="mt-1 font-display text-2xl font-bold">
                {today.finished
                  ? "You reached the summit! 🏔️"
                  : today.reviewDay && due.length === 0
                    ? "Light day: review & practise"
                    : today.aheadMode
                      ? "Get ahead with the next lesson"
                      : `${due.length} task${due.length === 1 ? "" : "s"} planned for today`}
              </h2>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                Daily goal: {plan.dailyMinutes} minutes · {minutesToday} done
              </p>
            </div>
            <Ring value={goalPct} size={84} stroke={9} label={`Daily goal ${Math.round(goalPct * 100)}%`}>
              <div>
                <div className="font-display text-lg font-bold leading-none">{Math.round(goalPct * 100)}%</div>
                <div className="text-[10px] font-bold uppercase" style={{ color: "var(--muted)" }}>
                  goal
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
                      <div className="truncate font-bold">{item.kind === "lesson" ? item.lesson.title : item.checkpoint.title}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-semibold" style={{ color: "var(--muted)" }}>
                        {item.kind === "lesson" ? (
                          <>
                            <SkillBadge skill={item.lesson.skill} /> ~{item.lesson.minutes} min · +{item.lesson.xp} XP
                          </>
                        ) : (
                          <span>Stage {item.stage} checkpoint · all four skills · ~60 min</span>
                        )}
                      </div>
                    </div>
                    {i === 0 ? (
                      <span className="btn btn-primary animate-pulse-ring hidden px-4 py-2 sm:inline-flex">
                        Start <Icon name="play" size={14} />
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
                    <div className="font-bold">Vocabulary review</div>
                    <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                      {vocabDue} word{vocabDue === 1 ? "" : "s"} ready · ~{Math.max(2, Math.ceil(vocabDue / 3))} min
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
                    <div className="font-bold">Talk with AI: {conversation.title}</div>
                    <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                      Learn the phrases, then role-play with ChatGPT · ~{conversation.minutes} min · +{conversation.xp} XP
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
                    <div className="font-bold">Bonus drill: {suggestedPractice.title}</div>
                    <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                      AI-graded {SKILL_META[suggestedPractice.skill].label.toLowerCase()} practice · targets your weakest skill
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
                <div className="font-display text-3xl font-bold leading-none">{user.streak} day{user.streak === 1 ? "" : "s"}</div>
                <div className="mt-1 text-sm font-semibold" style={{ color: "var(--muted)" }}>
                  {todayAct ? "Streak secured for today ✓" : user.streak > 0 ? "Complete one task to keep it alive" : "Complete a task to start your streak"}
                </div>
              </div>
              <div className="text-right text-xs font-semibold" style={{ color: "var(--muted)" }}>
                🧊 {user.streakFreezes} freeze{user.streakFreezes === 1 ? "" : "s"}
                <br />
                Best: {user.longestStreak}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-7 gap-1.5">
              {weekDays.map((d) => {
                const a = activity.find((x) => x.day === dayKey(d));
                const isToday = dayKey(d) === dayKey();
                return (
                  <div key={dayKey(d)} className="text-center">
                    <div className="text-[11px] font-bold" style={{ color: "var(--muted)" }}>
                      {d.toLocaleDateString("en-GB", { weekday: "narrow", timeZone: "UTC" })}
                    </div>
                    <div
                      className="mx-auto mt-1 grid h-8 w-8 place-items-center rounded-full"
                      style={{ background: a ? "var(--brand)" : "var(--surface-2)", color: "var(--brand-ink)", outline: isToday ? "2px solid var(--brand)" : undefined, outlineOffset: 2 }}
                      title={a ? `${a.minutes} min · ${a.xp} XP` : "No activity"}
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
              <div>
                <div className="eyebrow">Estimated overall</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-display text-5xl font-bold">{overall?.toFixed(1) ?? "—"}</span>
                  <span className="font-bold" style={{ color: "var(--muted)" }}>
                    {cefrForBand(overall)}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="eyebrow">Target</div>
                <BandPill band={target} />
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {SKILLS.map((s) => (
                <div key={s} className="flex items-center gap-3">
                  <span className="w-20 text-sm font-semibold">{SKILL_META[s].label}</span>
                  <div className="relative flex-1">
                    <ProgressBar value={(bands[s] ?? 0) / 9} color={SKILL_META[s].color} height={10} label={`${SKILL_META[s].label} band`} />
                    <span className="absolute top-[-3px] h-4 w-0.5 rounded" style={{ left: `${(target / 9) * 100}%`, background: "var(--ink)" }} aria-hidden="true" />
                  </div>
                  <span className="w-8 text-right font-display font-bold">{bands[s]?.toFixed(1) ?? "—"}</span>
                </div>
              ))}
            </div>
            <Link href="/progress" className="mt-4 inline-flex items-center gap-1 text-sm font-bold" style={{ color: "var(--brand)" }}>
              See full progress <Icon name="arrow" size={14} />
            </Link>
          </section>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.45fr]">
        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="font-display text-xl font-bold">Your journey</h2>
            <span className="text-sm font-bold" style={{ color: "var(--muted)" }}>
              {Math.round(overallProgress * 100)}% climbed
            </span>
          </div>
          <JourneyMap stages={stagesP} compact />
          <Link href="/journey" className="btn btn-ghost mt-4 w-full">
            Open the full map
          </Link>
        </section>
        <section className="card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-bold">Band trend</h2>
            <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
              Plan ends {formatDate(today.endDate)}
            </span>
          </div>
          <BandChart snapshots={snapshots} target={target} />
        </section>
      </div>
    </div>
  );
}
