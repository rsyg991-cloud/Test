import { addDays, daysBetween } from "@/lib/dates";

export interface PlanOption {
  months: 1 | 2 | 3 | 4 | 6 | 9 | 12;
  name: string;
  dailyMinutes: number;
  intensity: string;
  expectedGain: string;
  bestFor: string;
}

export const PLANS: PlanOption[] = [
  { months: 1, name: "Sprint", dailyMinutes: 150, intensity: "Intensive", expectedGain: "+0.5 band", bestFor: "Exam is very close; you need strategy and polish fast." },
  { months: 2, name: "Accelerate", dailyMinutes: 90, intensity: "High", expectedGain: "+0.5 to +1 band", bestFor: "A fixed exam date and real daily commitment." },
  { months: 3, name: "Balanced", dailyMinutes: 60, intensity: "Moderate", expectedGain: "+1 band", bestFor: "Most learners. Enough time to build real skill." },
  { months: 4, name: "Steady Climb", dailyMinutes: 45, intensity: "Comfortable", expectedGain: "+1 to +1.5 bands", bestFor: "Working or studying full-time." },
  { months: 6, name: "Deep Growth", dailyMinutes: 30, intensity: "Light", expectedGain: "+1.5 bands", bestFor: "Building long-lasting English, not just a score." },
  { months: 9, name: "Foundation Builder", dailyMinutes: 45, intensity: "Steady", expectedGain: "+2 to +2.5 bands", bestFor: "Starting from basic English (A1–A2) and aiming for an IELTS score." },
  { months: 12, name: "Zero to IELTS", dailyMinutes: 60, intensity: "Steady", expectedGain: "+3 bands or more", bestFor: "Absolute beginners. The whole journey, from your first words to the exam." },
];

export const PLAN_MONTHS: number[] = PLANS.map((p) => p.months);

export function getPlan(months: number | null | undefined): PlanOption {
  return PLANS.find((p) => p.months === months) ?? PLANS[2];
}

export const planDays = (months: number) => months * 30;

/** Every 7th day of the plan is a lighter review day. */
export const isReviewDay = (dayIndex: number) => dayIndex % 7 === 6;

/** Assign each curriculum item (in order) to a day index of the plan. */
export function scheduleItems(months: number, itemCount: number): number[] {
  const total = planDays(months);
  const studyDays: number[] = [];
  for (let d = 0; d < total; d++) if (!isReviewDay(d)) studyDays.push(d);
  // Keep the last two study days free as a buffer for a final mock / catch-up.
  const usable = studyDays.slice(0, Math.max(1, studyDays.length - 2));
  const S = usable.length;
  return Array.from({ length: itemCount }, (_, i) => usable[Math.min(S - 1, Math.floor((i * S) / itemCount))]);
}

/** How many items should be complete by the end of a given day. */
export function expectedBy(schedule: number[], dayIndex: number): number {
  return schedule.filter((d) => d <= dayIndex).length;
}

export interface TodayPlan {
  dayIndex: number;
  dayNumber: number;
  totalDays: number;
  reviewDay: boolean;
  finished: boolean;
  /** Indices (into the item list) to do today, in order. */
  dueIndices: number[];
  /** Whether today's list is "get ahead" work rather than scheduled work. */
  aheadMode: boolean;
  behind: number;
  expectedCount: number;
  endDate: Date;
  dailyMinutes: number;
}

export function computeToday(opts: {
  months: number;
  planStart: Date;
  today: Date;
  itemCount: number;
  completed: boolean[]; // per item
}): TodayPlan {
  const { months, planStart, today, itemCount, completed } = opts;
  const schedule = scheduleItems(months, itemCount);
  const totalDays = planDays(months);
  const dayIndex = Math.max(0, daysBetween(planStart, today));
  const expectedCount = expectedBy(schedule, dayIndex);
  const doneCount = completed.filter(Boolean).length;
  // Only work from previous days counts as "behind" — today's tasks are just today's tasks.
  const behind = Math.max(0, expectedBy(schedule, dayIndex - 1) - doneCount);

  const incomplete = completed.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0);
  const finished = incomplete.length === 0;

  // Items scheduled up to today that aren't done yet.
  const scheduledToday = schedule.filter((d) => d === dayIndex).length;
  const cap = Math.max(2, scheduledToday) + 2; // never overwhelm: at most a couple of extra catch-up items
  let due = incomplete.filter((i) => schedule[i] <= dayIndex).slice(0, cap);
  let aheadMode = false;
  if (due.length === 0 && !finished) {
    due = incomplete.slice(0, 1);
    aheadMode = true;
  }

  return {
    dayIndex,
    dayNumber: dayIndex + 1,
    totalDays,
    reviewDay: isReviewDay(dayIndex),
    finished,
    dueIndices: due,
    aheadMode,
    behind,
    expectedCount,
    endDate: addDays(planStart, totalDays - 1),
    dailyMinutes: getPlan(months).dailyMinutes,
  };
}

/**
 * Catch-up: shift the plan start so that the first unfinished item is scheduled for today.
 * Nothing is lost — the plan simply ends a little later.
 */
export function catchUpStart(opts: {
  months: number;
  planStart: Date;
  today: Date;
  itemCount: number;
  firstIncomplete: number;
}): Date {
  const schedule = scheduleItems(opts.months, opts.itemCount);
  const dayIndex = daysBetween(opts.planStart, opts.today);
  const target = schedule[opts.firstIncomplete] ?? dayIndex;
  const shift = Math.max(0, dayIndex - target);
  return addDays(opts.planStart, shift);
}

/** Lessons per study day if the path is spread over the plan (6 study days a week, 2 buffer days). */
export function lessonsPerDay(months: number, itemCount: number): number {
  const studyDays = Math.round((planDays(months) * 6) / 7) - 2;
  return itemCount / Math.max(1, studyDays);
}

/** How demanding a plan is for the learner's path: null when the pace is comfortable. */
export function paceLevel(months: number, itemCount: number): { level: "veryTight" | "busy"; n: number } | null {
  const perDay = lessonsPerDay(months, itemCount);
  const n = perDay >= 1.95 ? Math.round(perDay) : Math.round(perDay * 10) / 10;
  if (perDay > 2) return { level: "veryTight", n };
  if (perDay > 1.2) return { level: "busy", n };
  return null;
}

/** An honest note (English) when a plan is too short for the learner's path. Pages translate paceLevel instead. */
export function paceWarning(months: number, itemCount: number): string | null {
  const p = paceLevel(months, itemCount);
  if (!p) return null;
  return p.level === "veryTight"
    ? `Very tight: about ${p.n} lessons every day for your path. Choose a longer plan if you can.`
    : `Busy pace: about ${p.n} lessons a day. Doable with real daily commitment.`;
}

/** Roughly how many months the band gap needs at a realistic pace. */
export function monthsForGap(gap: number): number {
  return gap <= 0.5 ? 2 : gap <= 1 ? 3 : gap <= 1.5 ? 4 : gap <= 2 ? 6 : gap <= 3 ? 9 : 12;
}

/** Recommend a plan from the band gap and the exam date. */
export function recommendPlan(currentBand: number | null, targetBand: number, examDate: Date | null, today = new Date()): number {
  const gap = Math.max(0, targetBand - (currentBand ?? 5));
  let months: number = monthsForGap(gap);
  if (examDate) {
    const daysLeft = daysBetween(today, examDate);
    const fits = PLANS.filter((p) => planDays(p.months) <= daysLeft + 3).map((p) => p.months as number);
    if (fits.length === 0) return 1;
    if (!fits.includes(months)) months = Math.max(...fits);
  }
  return months;
}
