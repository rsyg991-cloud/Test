import type { Metadata } from "next";
import Link from "next/link";
import { FINAL_STAGE, passBandFor, stages } from "@/content";
import { Icon } from "@/components/icons";
import { JourneyMap } from "@/components/JourneyMap";
import { PageHeader, ProgressBar, SKILL_META, SkillIcon } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getCompletedIds, stageProgress } from "@/lib/progress";

export const metadata: Metadata = { title: "Journey" };

export default async function JourneyPage() {
  const user = await requireUser();
  const { ids, lessons } = await getCompletedIds(user.id);
  const sp = stageProgress(ids, user.unlockedStage, user);
  const bandOf = (id: string) => lessons.find((l) => l.lessonId === id)?.band ?? null;

  return (
    <div>
      <PageHeader eyebrow="The climb" title="Your journey" subtitle="Seven stages from your first words to exam mastery. Pass each checkpoint to unlock the next stage." />
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
                          Stage {s.id} · {s.camp} · {s.cefr}
                        </div>
                        <h2 className="mt-1 font-display text-2xl">{s.name}</h2>
                        {s.arabic && (
                          <div className="ar text-sm font-bold" lang="ar" dir="rtl" style={{ color: "var(--muted)" }}>
                            {s.arabic.name}: {s.arabic.tagline}
                          </div>
                        )}
                        <p className="mt-1 max-w-xl text-sm" style={{ color: "var(--muted)" }}>
                          {s.tagline} {s.description}
                        </p>
                      </div>
                      {locked ? (
                        <span className="chip" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                          <Icon name="lock" size={13} /> Pass Stage {s.id - 1} to unlock
                        </span>
                      ) : p.passed ? (
                        <span className="chip" style={{ background: "var(--success)", color: "var(--on-skill)" }}>
                          <Icon name="check" size={13} strokeWidth={3} /> Camp reached
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <ProgressBar value={p.pct} label={`Stage ${s.id} progress`} />
                      <span className="shrink-0 text-sm font-bold">
                        {p.done}/{p.total}
                      </span>
                    </div>
                  </div>

                  {s.units.map((u) => (
                    <div key={u.id} className="border-t px-5 py-4 sm:px-6" style={{ borderColor: "var(--line)" }}>
                      <div className="mb-3 flex items-baseline gap-2">
                        <span className="text-sm font-bold">
                          Unit {u.index}: {u.title}
                        </span>
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
                                <div className="truncate text-sm font-bold">{l.title}</div>
                                <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                                  {SKILL_META[l.skill].label} · {l.minutes} min
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
                      <div className="font-bold">{s.checkpoint.title}</div>
                      <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                        All four skills · reach Band {passBandFor(s.id).toFixed(1)} overall {s.id < FINAL_STAGE ? "to unlock the next stage" : "to reach the summit"}
                      </div>
                    </div>
                    {!locked && (
                      <Link href={`/checkpoint/${s.id}`} className={`btn ${p.passed ? "btn-ghost" : "btn-dark"} px-4 py-2`}>
                        {p.passed ? "Retake" : "Take checkpoint"}
                      </Link>
                    )}
                  </div>
                  {s.id === FINAL_STAGE && (
                    <div className="flex flex-wrap items-center gap-4 border-t px-5 py-4 sm:px-6" style={{ borderColor: "var(--line)" }}>
                      <span className="grid h-10 w-10 place-items-center rounded-md " style={{ background: "var(--brand)", color: "var(--brand-ink)" }}>
                        <Icon name="target" size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold">Full IELTS mock test</div>
                        <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                          Complete test with official timing — take it before your exam (open to all stages)
                        </div>
                      </div>
                      <Link href="/practice#mock-tests" className="btn btn-primary px-4 py-2">
                        Open
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
