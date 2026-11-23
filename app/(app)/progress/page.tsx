import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import type { Translator } from "@/lib/i18n/core";
import Link from "next/link";
import { getCheckpoint, getConversation, getLesson, getPractice, SKILLS } from "@/content";
import { BandChart } from "@/components/BandChart";
import { Icon } from "@/components/icons";
import { PageHeader, Ring, SKILL_META, SkillBadge } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addDays, dayKey } from "@/lib/dates";
import { getSkillBands } from "@/lib/progress";
import { cefrForBand, nextCefr } from "@/lib/scoring";
import { showsLevels } from "@/content/goals";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("meta.progress") };
}

function titleFor(tr: Translator, kind: string, refId: string) {
  if (kind === "lesson") return getLesson(refId)?.title ?? refId;
  if (kind === "checkpoint") {
    const cp = getCheckpoint(refId);
    return cp ? tr.t("journey.checkpointTitle", { camp: tr.stage(cp.stage, "camp") }) : refId;
  }
  if (kind === "practice") return tr.t("progress.drill", { title: getPractice(refId)?.title ?? refId });
  if (kind === "conversation") return tr.t("progress.conversation", { title: getConversation(refId)?.title ?? refId });
  if (kind === "mock") {
    const part = refId.split(":")[1] ?? "";
    return part.startsWith("task") ? tr.t("progress.mockWriting", { n: part.replace("task", "") }) : tr.t("progress.mockSpeaking", { n: part.split("-")[1] });
  }
  return tr.t("progress.placementTest");
}

export default async function ProgressPage() {
  const user = await requireUser();
  const tr = await getT();
  const { t, formatDate } = tr;
  const [{ bands, overall, snapshots }, attempts, days, lessonsDone, words] = await Promise.all([
    getSkillBands(user.id),
    prisma.attempt.findMany({ where: { userId: user.id, skill: { in: ["writing", "speaking", "conversation"] }, band: { not: null } }, orderBy: { createdAt: "desc" }, take: 12 }),
    prisma.activityDay.findMany({ where: { userId: user.id, day: { gte: dayKey(addDays(new Date(), -83)) } } }),
    prisma.lessonProgress.count({ where: { userId: user.id } }),
    prisma.vocabCard.count({ where: { userId: user.id } }),
  ]);
  // General English learners (no IELTS goal) see CEFR levels, never a band target.
  const levels = showsLevels(user.goals);
  const target = levels ? null : (user.targetBand ?? 7);
  const next = nextCefr(overall);
  const totalMinutes = days.reduce((a, d) => a + d.minutes, 0);
  const placement = snapshots.filter((s) => s.source === "placement");
  const startOverall = placement.length ? placement.reduce((a, s) => a + s.band, 0) / placement.length : null;
  const heat = Array.from({ length: 84 }, (_, i) => {
    const d = dayKey(addDays(new Date(), i - 83));
    return { d, m: days.find((x) => x.day === d)?.minutes ?? 0 };
  });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t("progress.eyebrow")} title={t("progress.title")} subtitle={t(levels ? "progress.subtitleLevels" : "progress.subtitle")} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card flex items-center gap-4 p-5">
          <Ring value={(overall ?? 0) / 9} size={72} stroke={8} label={t(levels ? "progress.overallLevel" : "progress.overallBand")}>
            <span className="num text-xl font-bold">{levels ? (overall === null ? "—" : cefrForBand(overall)) : (overall?.toFixed(1) ?? "—")}</span>
          </Ring>
          <div>
            <div className="eyebrow">{t("progress.overall")}</div>
            <div className="font-bold">{levels && next ? t("progress.nextLevel", { cefr: next }) : t("progress.level", { cefr: cefrForBand(overall) })}</div>
            {!levels && startOverall !== null && overall !== null && (
              <div className="text-sm font-semibold" style={{ color: overall - startOverall >= 0 ? "var(--success)" : "var(--muted)" }}>
                {t("progress.sincePlacement", { arrow: overall - startOverall >= 0 ? "▲" : "▼", gap: Math.abs(overall - startOverall).toFixed(1) })}
              </div>
            )}
          </div>
        </div>
        {[
          ["book", `${lessonsDone}`, t("progress.lessonsCompleted")],
          ["calendar", t("progress.studiedValue", { h: Math.floor(totalMinutes / 60), m: totalMinutes % 60 }), t("progress.studied")],
          ["cards", `${words}`, t("progress.wordsInDeck")],
        ].map(([icon, v, l]) => (
          <div key={l} className="card flex items-center gap-4 p-5">
            <span className="grid h-12 w-12 place-items-center rounded-[10px]" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
              <Icon name={icon} size={22} />
            </span>
            <div>
              <div className="num text-2xl font-bold">{v}</div>
              <div className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
                {l}
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="card p-5 sm:p-6">
        <h2 className="mb-4 font-display text-xl">{t(levels ? "progress.skillTrend" : "progress.bandTrend")}</h2>
        <BandChart snapshots={snapshots} target={target} height={280} levels={levels} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <h2 className="mb-4 font-display text-xl">{t(levels ? "progress.levels" : "progress.gaps")}</h2>
          <div className="space-y-4">
            {SKILLS.map((s) => {
              const b = bands[s];
              if (target === null) {
                const up = nextCefr(b);
                return (
                  <div key={s} className="flex items-center gap-3">
                    <SkillBadge skill={s} size="md" />
                    <div className="num flex-1 text-end text-lg font-bold" dir="ltr">
                      {b === null ? "—" : cefrForBand(b)}
                    </div>
                    <div className="w-36 text-end text-sm font-semibold" style={{ color: b !== null && !up ? "var(--success)" : "var(--muted)" }}>
                      {b === null ? t("progress.noData") : up ? t("progress.nextLevel", { cefr: up }) : t("progress.topLevel")}
                    </div>
                  </div>
                );
              }
              const gap = b === null ? null : target - b;
              return (
                <div key={s} className="flex items-center gap-3">
                  <SkillBadge skill={s} size="md" />
                  <div className="num flex-1 text-end text-lg font-bold">{b?.toFixed(1) ?? "—"}</div>
                  <div className="w-36 text-end text-sm font-semibold" style={{ color: gap !== null && gap <= 0 ? "var(--success)" : "var(--muted)" }}>
                    {gap === null ? t("progress.noData") : gap <= 0 ? t("progress.targetReached") : t("progress.toGo", { gap: gap.toFixed(1) })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <section className="card p-5 sm:p-6">
          <h2 className="mb-4 font-display text-xl">{t("progress.activity")}</h2>
          <div className="grid grid-flow-col grid-rows-7 gap-1" role="img" aria-label={t("progress.heatmapLabel")}>
            {heat.map((h) => (
              <span
                key={h.d}
                title={t("progress.heatTitle", { day: h.d, minutes: h.m })}
                className="aspect-square rounded-[4px]"
                style={{ background: h.m === 0 ? "var(--surface-2)" : `color-mix(in srgb, var(--brand) ${Math.min(100, 25 + h.m)}%, var(--surface-2))` }}
              />
            ))}
          </div>
        </section>
      </div>

      <section className="card p-5 sm:p-6">
        <h2 className="mb-4 font-display text-xl">{t("progress.recent")}</h2>
        {attempts.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>{t("progress.empty")}</p>
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
            {attempts.map((a) => {
              const fb = a.feedbackJson ? (JSON.parse(a.feedbackJson) as { summary?: string; improvements?: string[] }) : null;
              return (
                <li key={a.id} className="flex flex-wrap items-start gap-4 py-4" style={{ borderColor: "var(--line)" }}>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] num text-lg font-bold text-[var(--on-skill)]" style={{ background: SKILL_META[a.skill === "conversation" ? "speaking" : (a.skill as "writing")].color }}>
                    {a.band?.toFixed(1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold" dir="auto">
                      {titleFor(tr, a.kind, a.refId)}
                    </div>
                    <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                      {a.skill === "conversation" ? t("progress.aiConversation") : t(`skills.${a.skill as "writing" | "speaking"}`)} · {formatDate(a.createdAt)}
                    </div>
                    {fb?.improvements?.[0] && (
                      <p className="mt-1 text-sm">
                        <span className="font-semibold">{t("progress.nextStep")}</span>{" "}
                        <span lang="en" dir="ltr">
                          {fb.improvements[0]}
                        </span>
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Link href="/practice" className="btn btn-ghost mt-4">
          {t("progress.practiseNow")}
        </Link>
      </section>
    </div>
  );
}
