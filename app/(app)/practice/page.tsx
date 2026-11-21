import type { Metadata } from "next";
import Link from "next/link";
import { conversations, practicePrompts, stages } from "@/content";
import { Icon } from "@/components/icons";
import { PageHeader, SKILL_META, SkillIcon } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getAllTests } from "@/lib/mock/registry";
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
      <PageHeader
        eyebrow="Extra practice"
        title="Practice"
        subtitle="Talk with AI in real-life and exam role-plays, and sharpen your Writing and Speaking with instant examiner feedback."
      />

      <section id="mock-tests" className="mb-12 scroll-mt-24">
        <h2 className="mb-1 font-display text-2xl font-bold">Full mock tests</h2>
        <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
          The complete IELTS Academic test with official timing: 40 listening + 40 reading questions, two writing tasks and three speaking parts.{" "}
          <Link href="/resources" className="font-bold underline">Official resources</Link>
        </p>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 sm:grid-cols-2">
          {tests.map((t) => (
            <Link key={t.id} href={`/mock/${t.id}`} className="card flex items-center gap-4 p-5 transition-transform hover:-translate-y-0.5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[10px] text-white" style={{ background: "var(--navy)" }}>
                <Icon name="trophy" size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-bold">{t.title}</div>
                <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                  {t.source.kind === "licensed" ? t.source.attribution : "Original Balbal test"} · ~2 h 45 min
                </div>
              </div>
              {mockBest.has(t.id) && (
                <span className="chip" style={{ background: "var(--surface-2)" }}>
                  Best {mockBest.get(t.id)!.toFixed(1)}
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
              <h2 className="font-display text-2xl font-bold">AI Conversations</h2>
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                Learn the phrases first, then speak with ChatGPT using a ready-made role-play — and bring the conversation back for feedback.
              </p>
            </div>
            <span className="chip" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
              {convBest.size}/{conversations.length} completed
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
                  Stage {s.id} · {s.name} {locked && <Icon name="lock" size={14} />}
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
                              <Icon name="check" size={12} strokeWidth={3} /> {band ? band.toFixed(1) : "Done"}
                            </span>
                          ) : locked ? (
                            <Icon name="lock" size={16} style={{ color: "var(--muted)" }} />
                          ) : null}
                        </div>
                        <div className="mt-3 font-bold">{c.title}</div>
                        <div className="mt-1 line-clamp-2 text-sm" style={{ color: "var(--muted)" }}>
                          {c.situation}
                        </div>
                        <div className="mt-3 text-xs font-semibold" style={{ color: "var(--muted)" }}>
                          ~{c.minutes} min · {c.xp} XP
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

      <h2 className="mb-1 font-display text-2xl font-bold">AI practice drills</h2>
      <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>
        Extra Writing Task 2 and Speaking prompts with instant examiner feedback.
      </p>
      <div className="space-y-8">
        {stages.filter((s) => practicePrompts.some((p) => p.stage === s.id)).map((s) => {
          const prompts = practicePrompts.filter((p) => p.stage === s.id);
          const locked = s.id > user.unlockedStage;
          return (
            <section key={s.id}>
              <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
                Stage {s.id}: {s.name}
                {locked && <Icon name="lock" size={16} style={{ color: "var(--muted)" }} />}
              </h3>
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
