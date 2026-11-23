import type { Metadata } from "next";
import Link from "next/link";
import { generalUnits } from "@/content";
import { Icon } from "@/components/icons";
import { PageHeader, SkillIcon } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("general.title") };
}

/**
 * General English lessons (content/general), grouped by stage. A stage's lessons open once the
 * learner has unlocked that stage. They sit beside the learner's path, so nobody's plan changes.
 */
export default async function GeneralEnglishPage() {
  const user = await requireUser();
  const { t, stage } = await getT();
  const ids = generalUnits.flatMap((u) => u.lessons.map((l) => l.id));
  const done = new Map(
    (await prisma.lessonProgress.findMany({ where: { userId: user.id, lessonId: { in: ids } }, select: { lessonId: true, bestScore: true } })).map((p) => [
      p.lessonId,
      p.bestScore,
    ]),
  );
  const stageIds = [...new Set(generalUnits.map((u) => u.stage))].sort((a, b) => a - b);

  return (
    <div>
      <PageHeader eyebrow={t("general.eyebrow")} title={t("general.title")} subtitle={t("general.subtitle")} />
      {stageIds.map((sid) => {
        const open = sid <= user.unlockedStage;
        return (
          <section key={sid} className="mb-10">
            <h2 className="mb-1 font-display text-2xl">
              {t("general.stage", { n: sid, name: stage(sid, "name") })}
            </h2>
            {!open ? (
              <p className="mb-3 flex items-center gap-2 text-sm" style={{ color: "var(--muted)" }}>
                <Icon name="lock" size={14} /> {t("general.locked", { n: sid })}
              </p>
            ) : null}
            <div className="space-y-6">
              {generalUnits
                .filter((u) => u.stage === sid)
                .map((u) => (
                  <div key={u.id}>
                    <div className="eyebrow mb-2">
                      {t("general.unit", { n: u.index })} · <span lang="en">{u.title}</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {u.lessons.map((l) => {
                        const best = done.get(l.id);
                        const body = (
                          <>
                            <SkillIcon skill={l.skill} />
                            <div className="min-w-0 flex-1">
                              <div className="font-bold" lang="en" dir="ltr">
                                {l.title}
                              </div>
                              <div className="text-sm" style={{ color: "var(--muted)" }} lang="en" dir="ltr">
                                {l.focus}
                              </div>
                              {best !== undefined ? (
                                <div className="mt-1 text-xs font-bold" style={{ color: "var(--success)" }}>
                                  <Icon name="check" size={12} /> {t("general.done", { pct: Math.round(best * 100) })}
                                </div>
                              ) : null}
                            </div>
                          </>
                        );
                        return open ? (
                          <Link key={l.id} href={`/learn/${l.id}`} className="card flex items-start gap-3 p-4 transition hover:shadow-md">
                            {body}
                          </Link>
                        ) : (
                          <div key={l.id} className="card flex items-start gap-3 p-4" style={{ opacity: 0.55 }}>
                            {body}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
