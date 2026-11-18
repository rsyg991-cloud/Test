import Link from "next/link";
import { stages } from "@/content";
import { Icon } from "@/components/icons";
import { JourneyMap } from "@/components/JourneyMap";
import { Logo, SKILL_META } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { PLANS } from "@/lib/plan/scheduler";
import type { Skill } from "@/content/types";

const SKILL_COPY: Record<Skill, { title: string; body: string }> = {
  reading: { title: "Read faster, miss less", body: "Skimming, scanning, T/F/NG, headings and inference — with an explanation for every answer." },
  listening: { title: "Hear every detail", body: "Conversations and lectures in different voices, adjustable speed, and an exam mode that plays once." },
  writing: { title: "An examiner on demand", body: "Get a band for each criterion, line-by-line corrections and your own essay rewritten one band higher." },
  speaking: { title: "Speak with confidence", body: "Record your answers, see a live transcript and get fluency, vocabulary and grammar feedback in seconds." },
};

export default async function Home() {
  const user = await getCurrentUser();
  const demoStages = stages.map((s, i) => ({
    id: s.id,
    name: s.name,
    camp: s.camp,
    cefr: s.cefr,
    pct: i === 0 ? 1 : i === 1 ? 0.55 : 0,
    passed: i === 0,
    locked: i > 1,
  }));

  return (
    <div className="overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <Link href="/dashboard" className="btn btn-primary">
              Continue learning <Icon name="arrow" size={18} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost px-4">
                Log in
              </Link>
              <Link href="/register" className="btn btn-primary px-4">
                Start free
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-8 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
        <div className="animate-rise">
          <span className="chip mb-5" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
            <Icon name="mountain" size={14} /> The IELTS climb, B1 → Band 7+
          </span>
          <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Your English,
            <br />
            <span style={{ color: "var(--brand)" }}>one camp</span> higher
            <br />
            every week.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
            BandUp turns IELTS preparation into a guided climb: four stages, four skills, a plan that fits your exam date, and an AI
            examiner that tells you exactly how to reach the next band.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={user ? "/dashboard" : "/register"} className="btn btn-primary px-6 py-3.5 text-base">
              Take the free placement test <Icon name="arrow" size={18} />
            </Link>
            <span className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
              15 minutes · instant band estimate
            </span>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
            {[
              ["4", "stages"],
              ["48", "guided lessons"],
              ["24/7", "AI feedback"],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="font-display text-3xl font-bold">{n}</dd>
                <dd className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
                  {l}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="card p-3">
            <JourneyMap stages={demoStages} />
          </div>
          <div className="card animate-rise absolute -left-4 top-10 hidden w-52 p-4 sm:block" style={{ animationDelay: ".2s" }}>
            <div className="eyebrow">Writing · Task 2</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-3xl font-bold" style={{ color: "var(--writing)" }}>
                6.5
              </span>
              <span className="text-sm font-semibold" style={{ color: "var(--success)" }}>
                ▲ +1.0 in 6 weeks
              </span>
            </div>
          </div>
          <div className="card animate-rise absolute -right-3 bottom-16 hidden items-center gap-3 p-3.5 sm:flex" style={{ animationDelay: ".35s" }}>
            <span className="animate-flame grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: "var(--brand)" }}>
              <Icon name="flame" size={22} />
            </span>
            <div>
              <div className="font-display text-xl font-bold leading-none">23 days</div>
              <div className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                study streak
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20" style={{ background: "var(--surface)" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="eyebrow mb-2">How it works</div>
          <h2 className="font-display text-4xl font-bold tracking-tight">A clear path, every single day.</h2>
          <ol className="mt-10 grid gap-5 md:grid-cols-4">
            {[
              ["target", "Find your level", "A 15-minute placement test gives you a starting band for all four skills."],
              ["calendar", "Pick your pace", "1, 2, 3, 4 or 6 months. We build a day-by-day plan around your exam date."],
              ["mountain", "Climb 4 stages", "Short daily sessions: a strategy, key words, then a real IELTS-style task."],
              ["trophy", "Arrive exam-ready", "Checkpoint tests and a full mock prove you're ready before test day."],
            ].map(([icon, t, b], i) => (
              <li key={t} className="rounded-3xl p-6" style={{ background: "var(--bg)" }}>
                <div className="mb-4 flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                    <Icon name={icon} size={22} />
                  </span>
                  <span className="font-display text-4xl font-bold" style={{ color: "var(--line)" }}>
                    0{i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-bold">{t}</h3>
                <p className="mt-1 text-[15px]" style={{ color: "var(--muted)" }}>
                  {b}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Stages */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="eyebrow mb-2">The four stages</div>
        <h2 className="max-w-2xl font-display text-4xl font-bold tracking-tight">From Base Camp to the Summit.</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {stages.map((s) => (
            <article key={s.id} className="card relative overflow-hidden p-6">
              <div className="absolute -right-4 -top-6 font-display text-[120px] font-bold leading-none" style={{ color: "var(--surface-2)" }} aria-hidden="true">
                {s.id}
              </div>
              <div className="relative">
                <div className="eyebrow">{s.camp}</div>
                <h3 className="mt-1 font-display text-2xl font-bold">{s.name}</h3>
                <div className="mt-2 flex gap-2">
                  <span className="chip" style={{ background: "var(--surface-2)" }}>
                    {s.cefr}
                  </span>
                  <span className="chip" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>
                    Band {s.bandFrom}–{s.bandTo}
                  </span>
                </div>
                <p className="mt-4 text-[15px] leading-relaxed" style={{ color: "var(--muted)" }}>
                  {s.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section className="py-20" style={{ background: "var(--navy)", color: "#fff" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="eyebrow mb-2" style={{ color: "#aab3c8" }}>
            Four skills, one system
          </div>
          <h2 className="max-w-2xl font-display text-4xl font-bold tracking-tight">Practice that feels like the real test — feedback that doesn&apos;t.</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {(Object.keys(SKILL_COPY) as Skill[]).map((k) => (
              <div key={k} className="rounded-3xl p-6" style={{ background: "rgb(255 255 255 / 0.06)", border: "1px solid rgb(255 255 255 / 0.1)" }}>
                <span className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: SKILL_META[k].color }}>
                  <Icon name={SKILL_META[k].icon} size={22} />
                </span>
                <div className="mt-4 text-sm font-bold uppercase tracking-widest" style={{ color: "#aab3c8" }}>
                  {SKILL_META[k].label}
                </div>
                <h3 className="mt-1 text-xl font-bold">{SKILL_COPY[k].title}</h3>
                <p className="mt-2 leading-relaxed" style={{ color: "#c9d0de" }}>
                  {SKILL_COPY[k].body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="eyebrow mb-2">Choose your pace</div>
        <h2 className="max-w-2xl font-display text-4xl font-bold tracking-tight">How fast do you want to climb?</h2>
        <p className="mt-3 max-w-2xl" style={{ color: "var(--muted)" }}>
          Every plan covers the full journey. The difference is how much you do each day. Fall behind? One tap builds a catch-up plan — no guilt.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PLANS.map((p) => {
            const rec = p.months === 3;
            return (
              <div
                key={p.months}
                className="card relative flex flex-col p-5"
                style={rec ? { borderColor: "var(--brand)", borderWidth: 2, transform: "translateY(-6px)" } : undefined}
              >
                {rec && (
                  <span className="chip absolute -top-3 left-5" style={{ background: "var(--brand)", color: "#fff" }}>
                    Most popular
                  </span>
                )}
                <div className="font-display text-4xl font-bold">
                  {p.months}
                  <span className="ml-1 text-base font-sans font-bold" style={{ color: "var(--muted)" }}>
                    {p.months === 1 ? "month" : "months"}
                  </span>
                </div>
                <div className="mt-1 font-bold">{p.name}</div>
                <div className="mt-4 space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Icon name="calendar" size={15} style={{ color: "var(--brand)" }} /> ~{p.dailyMinutes >= 60 ? `${p.dailyMinutes / 60}h` : `${p.dailyMinutes} min`} a day
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="chart" size={15} style={{ color: "var(--brand)" }} /> {p.expectedGain}
                  </div>
                </div>
                <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
                  {p.bestFor}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] p-10 text-center sm:p-16" style={{ background: "linear-gradient(135deg, var(--brand), var(--gold))", color: "#fff" }}>
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">The summit is closer than you think.</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg opacity-90">Start with a 15-minute placement test and see your personalised plan today.</p>
          <Link href={user ? "/dashboard" : "/register"} className="btn mt-8 px-7 py-4 text-base" style={{ background: "#fff", color: "var(--navy)" }}>
            Start my climb <Icon name="arrow" size={18} />
          </Link>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
        BandUp · Independent IELTS preparation. IELTS is a registered trademark of its owners; BandUp is not affiliated with them.
      </footer>
    </div>
  );
}
