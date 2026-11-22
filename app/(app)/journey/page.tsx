import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import Link from "next/link";
import { FINAL_STAGE, passBandFor, stages } from "@/content";
import { Icon } from "@/components/icons";
import { JourneyMap } from "@/components/JourneyMap";
import { PageHeader, ProgressBar, SkillIcon } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getCompletedIds, stageProgress } from "@/lib/progress";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("meta.journey") };
}

export default async function JourneyPage() {
  const user = await requireUser();
  const { t, stage, locale } = await getT();
  const { ids, lessons } = await getCompletedIds(user.id);
  const sp = stageProgress(ids, user.unlockedStage, user);
  const bandOf = (id: string) => lessons.find((l) => l.lessonId === id)?.band ?? null;

  return (
    <div>
      <PageHeader eyebrow={t("journey.eyebrow")} title={t("journey.title")} subtitle={t("journey.subtitle")} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-8 lg:self-start">
          <div className="card p-3">
            <JourneyMap stages={sp} />
          </div>
        </div>

        <div className="space-y-8">
          {stages.map((s, si) => {
            const p = sp[si];
            const locked = p.locked;
            return (
              <section key={s.id} id={`stage-${s.id}`} className="scroll-mt-24">
                <div className="card overflow-hidden" style={{ opacity: locked ? 0.75 : 1 }}>
                  <div className="p-5 sm:p-6" style={{ background: p.passed ? "color-mix(in srgb, var(--success) 10%, var(--surface))" : "var(--surface)" }}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="eyebrow">
                          {t("journey.stageLine", { n: s.id, camp: stage(s.id, "camp"), cefr: s.cefr })}
                        </div>
                        <h2 className="mt-1 font-display text-2xl">{stage(s.id, "name")}</h2>
                        {locale === "en" && s.arabic && (
                          <div className="ar text-sm font-bold" lang="ar" dir="rtl" style={{ color: "var(--muted)" }}>
                            {s.arabic.name}: {s.arabic.tagline}
                          </div>
                        )}
                        <p className="mt-1 max-w-xl text-sm" style={{ color: "var(--muted)" }}>
                          {stage(s.id, "tagline")} {stage(s.id, "description")}
                        </p>
                      </div>
                      {locked ? (
                        <span className="chip" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                          <Icon name="lock" size={13} /> {t("journey.passToUnlock", { n: s.id - 1 })}
                        </span>
                      ) : p.passed ? (
                        <span className="chip" style={{ background: "var(--success)", color: "var(--on-skill)" }}>
                          <Icon name="check" size={13} strokeWidth={3} /> {t("journey.campReached")}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <ProgressBar value={p.pct} label={t("journey.stageProgress", { n: s.id })} />
                      <span className="num shrink-0 text-sm font-bold" dir="ltr">
                        {p.done}/{p.total}
                      </span>
                    </div>
                  </div>

                  {s.units.map((u) => (
                    <div key={u.id} className="border-t px-5 py-4 sm:px-6" style={{ borderColor: "var(--line)" }}>
                      <div className="mb-3 flex items-baseline gap-2">
                        <span className="text-sm font-bold">{t("journey.unitLine", { n: u.index, title: u.title })}</span>
                        <span className="text-xs" style={{ color: "var(--muted)" }}>
                          {u.theme}
                        </span>
                      </div>
                      <div className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
                        {u.lessons.map((l) => {
                          const done = ids.has(l.id);
                          const band = bandOf(l.id);
                          const inner = (
                            <>
                              <SkillIcon skill={l.skill} size={38} />
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-bold" dir="auto">
                                  {l.title}
                                </div>
                                <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                                  {t(`skills.${l.skill}`)} · {t("common.minutesShort", { n: l.minutes })}
                                </div>
                              </div>
                              {done ? (
                                <span className="chip" style={{ background: "color-mix(in srgb, var(--success) 14%, transparent)", color: "var(--success)" }}>
                                  <Icon name="check" size={12} strokeWidth={3} /> {band?.toFixed(1)}
                                </span>
                              ) : locked ? (
                                <Icon name="lock" size={16} style={{ color: "var(--muted)" }} />
                              ) : null}
                            </>
                          );
                          return locked ? (
                            <div key={l.id} className="flex items-center gap-3 rounded-md p-2.5" style={{ background: "var(--surface-2)" }}>
                              {inner}
                            </div>
                          ) : (
                            <Link key={l.id} href={`/learn/${l.id}`} className="flex items-center gap-3 rounded-md border p-2.5 transition-colors hover:bg-[var(--surface-2)]" style={{ borderColor: "var(--line)" }}>
                              {inner}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-wrap items-center gap-4 border-t px-5 py-4 sm:px-6" style={{ borderColor: "var(--line)", background: "var(--surface-2)" }}>
                    <span className="grid h-10 w-10 place-items-center rounded-md text-white" style={{ background: "var(--navy)" }}>
                      <Icon name="trophy" size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold">{t("journey.checkpointTitle", { camp: stage(s.id, "camp") })}</div>
                      <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                        {t(s.id < FINAL_STAGE ? "journey.checkpointMeta" : "journey.checkpointMetaFinal", { band: passBandFor(s.id).toFixed(1) })}
                      </div>
                    </div>
                    {!locked && (
                      <Link href={`/checkpoint/${s.id}`} className={`btn ${p.passed ? "btn-ghost" : "btn-dark"} px-4 py-2`}>
                        {p.passed ? t("common.retake") : t("journey.takeCheckpoint")}
                      </Link>
                    )}
                  </div>
                  {s.id === FINAL_STAGE && (
                    <div className="flex flex-wrap items-center gap-4 border-t px-5 py-4 sm:px-6" style={{ borderColor: "var(--line)" }}>
                      <span className="grid h-10 w-10 place-items-center rounded-md " style={{ background: "var(--brand)", color: "var(--brand-ink)" }}>
                        <Icon name="target" size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold">{t("journey.mockTitle")}</div>
                        <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                          {t("journey.mockMeta")}
                        </div>
                      </div>
                      <Link href="/practice#mock-tests" className="btn btn-primary px-4 py-2">
                        {t("common.open")}
                      </Link>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
