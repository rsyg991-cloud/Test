import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { stage0Lessons } from "@/content/stage0";
import { Icon } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { flags } from "@/lib/flags";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Stage 0" };

export default async function StarterPage() {
  if (!flags.stage0()) notFound();
  const user = await requireUser();
  const { t } = await getT();
  const progress = await prisma.lessonProgress.findMany({ where: { userId: user.id, stage: 0 }, select: { lessonId: true, bestScore: true } });
  const best = new Map(progress.map((p) => [p.lessonId, p.bestScore]));

  const units = [...new Set(stage0Lessons.map((l) => l.unit))];
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl">{t("starter.title")}</h1>
        <p style={{ color: "var(--muted)" }}>{t("starter.intro")}</p>
      </header>
      {units.map((unit) => (
        <section key={unit} className="space-y-3">
          <h2 className="eyebrow">{unit === 0 ? t("starter.unit0") : t("starter.unit", { n: unit })}</h2>
          <ol className="space-y-2">
            {stage0Lessons
              .filter((l) => l.unit === unit)
              .map((l) => {
                const i = stage0Lessons.indexOf(l);
                const open = i === 0 || best.has(stage0Lessons[i - 1].id);
                const done = best.has(l.id);
                return (
                  <li key={l.id} className="card flex items-center gap-4 p-4" style={{ opacity: open ? 1 : 0.6 }}>
                    <span
                      className="grid size-10 shrink-0 place-items-center rounded-full font-bold"
                      style={{ background: done ? "var(--success)" : "var(--brand-soft)", color: done ? "var(--brand-ink)" : "var(--ink)" }}
                    >
                      {done ? <Icon name="check" size={18} /> : open ? <span className="num">{l.index}</span> : <Icon name="lock" size={16} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="ar font-bold" dir="rtl">{l.titleAr}</div>
                      <div className="text-sm" style={{ color: "var(--muted)" }}>
                        <span dir="ltr" lang="en">{l.title}</span> · {t("starter.minutes", { n: l.minutes })}
                        {done ? ` · ${t("starter.best", { pct: Math.round((best.get(l.id) ?? 0) * 100) })}` : ""}
                      </div>
                    </div>
                    {open ? (
                      <Link href={`/starter/${l.id}`} className={`btn ${done ? "btn-ghost" : "btn-primary"}`}>
                        {done ? t("starter.again") : t("starter.start")}
                      </Link>
                    ) : (
                      <span className="ar text-xs" style={{ color: "var(--muted)" }}>{t("starter.locked")}</span>
                    )}
                  </li>
                );
              })}
          </ol>
        </section>
      ))}
    </div>
  );
}
