import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import Link from "next/link";
import { conversations, practicePrompts, stages } from "@/content";
import { Icon } from "@/components/icons";
import { PageHeader, SkillIcon } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getAllTests } from "@/lib/mock/registry";
import { prisma } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("meta.practice") };
}

export default async function PracticePage() {
  const user = await requireUser();
  const { t, stage } = await getT();
  const attempts = await prisma.attempt.findMany({
    where: { userId: user.id, kind: "practice" },
    orderBy: { createdAt: "desc" },
    select: { refId: true, band: true },
  });
  const best = new Map<string, number>();
  for (const a of attempts) if (a.band !== null) best.set(a.refId, Math.max(best.get(a.refId) ?? 0, a.band));
  const convDone = await prisma.attempt.findMany({
    where: { userId: user.id, kind: "conversation-complete" },
    select: { refId: true, band: true },
  });
  const tests = getAllTests();
  const mockAttempts = await prisma.attempt.findMany({ where: { userId: user.id, kind: "mock" }, select: { refId: true, band: true } });
  const mockBest = new Map<string, number>();
  for (const m of mockAttempts) if (m.band !== null) mockBest.set(m.refId, Math.max(mockBest.get(m.refId) ?? 0, m.band));
  const convBest = new Map<string, number | null>();
  for (const c of convDone) convBest.set(c.refId, Math.max(convBest.get(c.refId) ?? 0, c.band ?? 0) || null);

  return (
    <div>
      <PageHeader eyebrow={t("practice.eyebrow")} title={t("practice.title")} subtitle={t("practice.subtitle")} />

      <section id="mock-tests" className="mb-12 scroll-mt-24">
        <h2 className="mb-1 font-display text-2xl">{t("practice.mockTitle")}</h2>
        <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
          {t("practice.mockBody")}{" "}
          <Link href="/resources" className="font-bold underline">
            {t("practice.officialResources")}
          </Link>
        </p>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
          {tests.map((test) => (
            <Link key={test.id} href={`/mock/${test.id}`} className="card flex items-center gap-4 p-5 transition-transform hover:-translate-y-0.5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] text-white" style={{ background: "var(--navy)" }}>
                <Icon name="trophy" size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-bold" dir="auto">
                  {test.title}
                </div>
                <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                  {test.source.kind === "licensed" ? test.source.attribution : t("practice.originalTest")} · {t("practice.mockLength")}
                </div>
              </div>
              {mockBest.has(test.id) && (
                <span className="chip" style={{ background: "var(--surface-2)" }}>
                  {t("practice.best", { band: mockBest.get(test.id)!.toFixed(1) })}
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>

      <section id="conversations" className="mb-12 scroll-mt-24">
        <div className="card mb-5 overflow-hidden">
          <div className="flex flex-wrap items-center gap-5 p-5 sm:p-6" style={{ background: "color-mix(in srgb, var(--speaking) 10%, var(--surface))" }}>
            <span className="hidden h-14 w-14 place-items-center rounded-[10px] text-[var(--on-skill)] sm:grid" style={{ background: "var(--speaking)" }}>
              <Icon name="mic" size={26} />
            </span>
            <div className="w-full min-w-0 sm:w-auto sm:flex-1">
              <h2 className="font-display text-2xl">{t("practice.convTitle")}</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                {t("practice.convBody")}
              </p>
            </div>
            <span className="chip" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
              {t("practice.convCount", { done: convBest.size, total: conversations.length })}
            </span>
          </div>
        </div>
        <div className="space-y-6">
          {stages.filter((s) => conversations.some((c) => c.stage === s.id)).map((s) => {
            const list = conversations.filter((c) => c.stage === s.id);
            const locked = s.id > user.unlockedStage;
            return (
              <div key={s.id}>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                  {t("practice.stageHeading", { n: s.id, name: stage(s.id, "name") })} {locked && <Icon name="lock" size={14} />}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((c) => {
                    const done = convBest.has(c.id);
                    const band = convBest.get(c.id);
                    const body = (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <span className="chip" style={{ background: "color-mix(in srgb, var(--speaking) 12%, transparent)", color: "var(--speaking)" }}>
                            {c.ieltsPart}
                          </span>
                          {done ? (
                            <span className="chip" style={{ background: "color-mix(in srgb, var(--success) 14%, transparent)", color: "var(--success)" }}>
                              <Icon name="check" size={12} strokeWidth={3} /> {band ? band.toFixed(1) : t("practice.done")}
                            </span>
                          ) : locked ? (
                            <Icon name="lock" size={16} style={{ color: "var(--muted)" }} />
                          ) : null}
                        </div>
                        <div className="mt-3 font-bold" dir="auto">
                          {c.title}
                        </div>
                        <div className="mt-1 line-clamp-2 text-sm" style={{ color: "var(--muted)" }} lang="en" dir="ltr">
                          {c.situation}
                        </div>
                        <div className="mt-3 text-xs font-semibold" style={{ color: "var(--muted)" }}>
                          {t("practice.convMeta", { minutes: c.minutes, xp: c.xp })}
                        </div>
                      </>
                    );
                    return locked ? (
                      <div key={c.id} className="card p-4 opacity-60">
                        {body}
                      </div>
                    ) : (
                      <Link key={c.id} href={`/conversations/${c.id}`} className="card p-4 transition-transform hover:-translate-y-0.5">
                        {body}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <h2 className="mb-1 font-display text-2xl">{t("practice.drillsTitle")}</h2>
      <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>
        {t("practice.drillsBody")}
      </p>
      <div className="space-y-8">
        {stages.filter((s) => practicePrompts.some((p) => p.stage === s.id)).map((s) => {
          const prompts = practicePrompts.filter((p) => p.stage === s.id);
          const locked = s.id > user.unlockedStage;
          return (
            <section key={s.id}>
              <h3 className="mb-3 flex items-center gap-2 font-display text-lg">
                {t("practice.drillStage", { n: s.id, name: stage(s.id, "name") })}
                {locked && <Icon name="lock" size={16} style={{ color: "var(--muted)" }} />}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {prompts.map((p) => {
                  const b = best.get(p.id);
                  const body = (
                    <>
                      <SkillIcon skill={p.skill} size={40} />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold" dir="auto">
                          {p.title}
                        </div>
                        <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                          {t(`skills.${p.skill}`)}
                          {p.speaking ? ` · ${t("practice.part", { n: p.speaking.part })}` : " · Task 2"}
                        </div>
                      </div>
                      {b !== undefined && (
                        <span className="chip" style={{ background: "var(--surface-2)" }}>
                          {t("practice.best", { band: b.toFixed(1) })}
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
