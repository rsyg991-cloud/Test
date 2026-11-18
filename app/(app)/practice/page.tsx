import type { Metadata } from "next";
import Link from "next/link";
import { practicePrompts, stages } from "@/content";
import { Icon } from "@/components/icons";
import { PageHeader, SKILL_META, SkillIcon } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Practice" };

export default async function PracticePage() {
  const user = await requireUser();
  const attempts = await prisma.attempt.findMany({
    where: { userId: user.id, kind: "practice" },
    orderBy: { createdAt: "desc" },
    select: { refId: true, band: true },
  });
  const best = new Map<string, number>();
  for (const a of attempts) if (a.band !== null) best.set(a.refId, Math.max(best.get(a.refId) ?? 0, a.band));

  return (
    <div>
      <PageHeader
        eyebrow="Extra practice"
        title="AI practice drills"
        subtitle="Unlimited Writing and Speaking practice with instant examiner feedback. Perfect for the extra minutes in your daily plan."
      />
      <div className="space-y-8">
        {stages.map((s) => {
          const prompts = practicePrompts.filter((p) => p.stage === s.id);
          const locked = s.id > user.unlockedStage;
          return (
            <section key={s.id}>
              <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold">
                Stage {s.id}: {s.name}
                {locked && <Icon name="lock" size={16} style={{ color: "var(--muted)" }} />}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {prompts.map((p) => {
                  const b = best.get(p.id);
                  const body = (
                    <>
                      <SkillIcon skill={p.skill} size={40} />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold">{p.title}</div>
                        <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                          {SKILL_META[p.skill].label}
                          {p.speaking ? ` · Part ${p.speaking.part}` : " · Task 2"}
                        </div>
                      </div>
                      {b !== undefined && (
                        <span className="chip" style={{ background: "var(--surface-2)" }}>
                          Best {b.toFixed(1)}
                        </span>
                      )}
                    </>
                  );
                  return locked ? (
                    <div key={p.id} className="card flex items-center gap-3 p-4 opacity-60">
                      {body}
                    </div>
                  ) : (
                    <Link key={p.id} href={`/practice/${p.id}`} className="card flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5">
                      {body}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
