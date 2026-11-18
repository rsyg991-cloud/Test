import type { Metadata } from "next";
import Link from "next/link";
import { getCheckpoint, getConversation, getLesson, getPractice, SKILLS } from "@/content";
import { BandChart } from "@/components/BandChart";
import { Icon } from "@/components/icons";
import { PageHeader, Ring, SKILL_META, SkillBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addDays, dayKey } from "@/lib/dates";
import { getSkillBands } from "@/lib/progress";
import { cefrForBand } from "@/lib/scoring";

export const metadata: Metadata = { title: "Progress" };

function titleFor(kind: string, refId: string) {
  if (kind === "lesson") return getLesson(refId)?.title ?? refId;
  if (kind === "checkpoint") return getCheckpoint(refId)?.title ?? refId;
  if (kind === "practice") return `Drill: ${getPractice(refId)?.title ?? refId}`;
  if (kind === "conversation") return `Conversation: ${getConversation(refId)?.title ?? refId}`;
  if (kind === "mock") {
    const part = refId.split(":")[1] ?? "";
    return `Mock test: ${part.startsWith("task") ? `Writing ${part.replace("task", "Task ")}` : `Speaking Part ${part.split("-")[1]}`}`;
  }
  return "Placement test";
}

export default async function ProgressPage() {
  const user = await requireUser();
  const [{ bands, overall, snapshots }, attempts, days, lessonsDone, words] = await Promise.all([
    getSkillBands(user.id),
    prisma.attempt.findMany({ where: { userId: user.id, skill: { in: ["writing", "speaking", "conversation"] }, band: { not: null } }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.activityDay.findMany({ where: { userId: user.id, day: { gte: dayKey(addDays(new Date(), -83)) } } }),
    prisma.lessonProgress.count({ where: { userId: user.id } }),
    prisma.vocabCard.count({ where: { userId: user.id } }),
  ]);
  const target = user.targetBand ?? 7;
  const totalMinutes = days.reduce((a, d) => a + d.minutes, 0);
  const placement = snapshots.filter((s) => s.source === "placement");
  const startOverall = placement.length ? placement.reduce((a, s) => a + s.band, 0) / placement.length : null;
  const heat = Array.from({ length: 84 }, (_, i) => {
    const d = dayKey(addDays(new Date(), i - 83));
    return { d, m: days.find((x) => x.day === d)?.minutes ?? 0 };
  });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Your growth" title="Progress" subtitle="Your estimated IELTS band, updated after every lesson, drill and checkpoint." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center gap-4 p-5">
          <Ring value={(overall ?? 0) / 9} size={72} stroke={8} label="Overall band">
            <span className="font-display text-xl font-bold">{overall?.toFixed(1) ?? "—"}</span>
          </Ring>
          <div>
            <div className="eyebrow">Overall</div>
            <div className="font-bold">{cefrForBand(overall)} level</div>
            {startOverall !== null && overall !== null && (
              <div className="text-sm font-semibold" style={{ color: overall - startOverall >= 0 ? "var(--success)" : "var(--muted)" }}>
                {overall - startOverall >= 0 ? "▲" : "▼"} {Math.abs(overall - startOverall).toFixed(1)} since placement
              </div>
            )}
          </div>
        </div>
        {[
          ["book", `${lessonsDone}`, "lessons completed"],
          ["calendar", `${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}m`, "studied (12 weeks)"],
          ["cards", `${words}`, "words in your deck"],
        ].map(([icon, v, l]) => (
          <div key={l} className="card flex items-center gap-4 p-5">
            <span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
              <Icon name={icon} size={22} />
            </span>
            <div>
              <div className="font-display text-2xl font-bold">{v}</div>
              <div className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
                {l}
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="card p-5 sm:p-6">
        <h2 className="mb-4 font-display text-xl font-bold">Band trend by skill</h2>
        <BandChart snapshots={snapshots} target={target} height={280} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <h2 className="mb-4 font-display text-xl font-bold">Skill gaps to your target</h2>
          <div className="space-y-4">
            {SKILLS.map((s) => {
              const b = bands[s];
              const gap = b === null ? null : target - b;
              return (
                <div key={s} className="flex items-center gap-3">
                  <SkillBadge skill={s} size="md" />
                  <div className="flex-1 text-right font-display text-lg font-bold">{b?.toFixed(1) ?? "—"}</div>
                  <div className="w-36 text-right text-sm font-semibold" style={{ color: gap !== null && gap <= 0 ? "var(--success)" : "var(--muted)" }}>
                    {gap === null ? "No data yet" : gap <= 0 ? "Target reached ✓" : `${gap.toFixed(1)} to go`}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <section className="card p-5 sm:p-6">
          <h2 className="mb-4 font-display text-xl font-bold">Study activity · last 12 weeks</h2>
          <div className="grid grid-flow-col grid-rows-7 gap-1" role="img" aria-label="Daily study activity heatmap">
            {heat.map((h) => (
              <span
                key={h.d}
                title={`${h.d}: ${h.m} min`}
                className="aspect-square rounded-[4px]"
                style={{ background: h.m === 0 ? "var(--surface-2)" : `color-mix(in srgb, var(--brand) ${Math.min(100, 25 + h.m)}%, var(--surface-2))` }}
              />
            ))}
          </div>
        </section>
      </div>

      <section className="card p-5 sm:p-6">
        <h2 className="mb-4 font-display text-xl font-bold">Recent Writing, Speaking & Conversation feedback</h2>
        {attempts.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>Your AI-graded answers will appear here.</p>
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
            {attempts.map((a) => {
              const fb = a.feedbackJson ? (JSON.parse(a.feedbackJson) as { summary?: string; improvements?: string[] }) : null;
              return (
                <li key={a.id} className="flex flex-wrap items-start gap-4 py-4" style={{ borderColor: "var(--line)" }}>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-display text-lg font-bold text-white" style={{ background: SKILL_META[a.skill === "conversation" ? "speaking" : (a.skill as "writing")].color }}>
                    {a.band?.toFixed(1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{titleFor(a.kind, a.refId)}</div>
                    <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                      {a.skill === "conversation" ? "AI Conversation" : SKILL_META[a.skill as "writing"].label} · {a.createdAt.toLocaleDateString("en-GB")}
                    </div>
                    {fb?.improvements?.[0] && (
                      <p className="mt-1 text-sm">
                        <span className="font-semibold">Next step:</span> {fb.improvements[0]}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Link href="/practice" className="btn btn-ghost mt-4">
          Practise now
        </Link>
      </section>
    </div>
  );
}
