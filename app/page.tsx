import Link from "next/link";
import { allLessons, stages } from "@/content";
import { Icon } from "@/components/icons";
import { JourneyMap } from "@/components/JourneyMap";
import { Logo, SKILL_META } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { PLANS } from "@/lib/plan/scheduler";
import type { Skill } from "@/content/types";

const SKILL_COPY: Record<Skill, { title: string; body: string }> = {
  reading: { title: "Read faster, miss less", body: "From your first short texts to True/False/Not Given and headings, with an explanation for every answer." },
  listening: { title: "Hear every detail", body: "Slow, clear audio for beginners, then real exam speed: conversations, talks and lectures, with an exam mode that plays once." },
  writing: { title: "An examiner on demand", body: "From your first five sentences to a Task 2 essay: a band for each criterion, corrections and your text rewritten one band higher." },
  speaking: { title: "Speak with confidence", body: "Record your answers, see a live transcript and get fluency, vocabulary and grammar feedback in seconds." },
};

const ENTRY_POINTS = [
  {
    level: "A0",
    title: "Starting from zero",
    body: "Never studied English, or forgot it all? Stage 1 starts with the alphabet, numbers and your first sentences, with every step explained in Arabic.",
    ar: "تبدأ من الصفر؟ نشرح لك كل خطوة بالعربي.",
    start: "Stage 1",
  },
  {
    level: "A1–A2",
    title: "You know the basics",
    body: "You can introduce yourself and get by slowly. Stages 2–3 build everyday English, then take you into the real IELTS question types.",
    ar: "تعرف الأساسيات؟ نبني عليها حتى تدخل الاختبار.",
    start: "Stage 2 or 3",
  },
  {
    level: "B1+",
    title: "Ready for the exam",
    body: "Take the 15-minute placement test. We place you in the right IELTS stage and plan every day up to your exam date.",
    ar: "مستواك متوسط أو أعلى؟ ابدأ باختبار تحديد المستوى.",
    start: "Stage 4–7",
  },
];

export default async function Home() {
  const user = await getCurrentUser();
  const demoStages = stages.map((s) => ({
    id: s.id,
    name: s.name,
    camp: s.camp,
    cefr: s.cefr,
    pct: s.id <= 2 ? 1 : s.id === 3 ? 0.55 : 0,
    passed: s.id <= 2,
    locked: s.id > 3,
    inPlan: s.id <= 6,
  }));
  const foundation = stages.filter((s) => s.foundation);
  const ielts = stages.filter((s) => !s.foundation);
  const cta = user ? "/dashboard" : "/register";

  return (
    <div className="overflow-x-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <Link href="/dashboard" className="btn btn-primary">
              Continue <Icon name="arrow" size={18} />
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
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-8 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pt-14">
        <div className="animate-rise min-w-0">
          <div className="eyebrow mb-4">IELTS preparation · from any level</div>
          <h1 className="font-display text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[4.1rem]">
            From your first words to <span className="hl">Band&nbsp;7</span>.
          </h1>
          <p className="ar mt-4 text-xl font-bold" lang="ar" dir="rtl">
            من الصفر إلى الدرجة اللي تحتاجها.
          </p>
          <p className="mt-4 max-w-xl text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
            BandUp takes you from wherever you are, even absolute beginner, to the IELTS band you need. Seven stages, four skills, a plan
            that fits your exam date, and an AI examiner that shows you exactly how to reach the next band.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={cta} className="btn btn-primary px-6 py-3.5 text-base">
              Find my starting point <Icon name="arrow" size={18} />
            </Link>
            <span className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
              Free · 2 minutes, or a 15-minute placement test
            </span>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
            {[
              [String(stages.length), "stages, A0 to C1"],
              [String(allLessons.length), "guided lessons"],
              ["24/7", "AI feedback"],
            ].map(([n, l]) => (
              <div key={l} className="border-l-2 pl-3" style={{ borderColor: "var(--line)" }}>
                <dt className="sr-only">{l}</dt>
                <dd className="num text-3xl font-bold">{n}</dd>
                <dd className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
                  {l}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <JourneyMap stages={demoStages} compact />
          <div className="card animate-rise absolute -right-3 top-6 hidden w-56 p-4 sm:block" style={{ animationDelay: ".2s", boxShadow: "var(--shadow)" }}>
            <div className="eyebrow">Estimated overall</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="num text-4xl font-bold">4.5</span>
              <span className="text-sm font-bold" style={{ color: "var(--success)" }}>
                ▲ +2.0 from zero
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Start where you are */}
      <section className="ruled border-y py-20" style={{ borderColor: "var(--line)" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="eyebrow mb-2">Start where you are</div>
          <h2 className="max-w-2xl font-display text-3xl sm:text-4xl">You don&apos;t need to be B1 to begin.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {ENTRY_POINTS.map((e) => (
              <article key={e.level} className="card flex flex-col p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="num rounded-md px-2.5 py-1 text-sm font-bold" style={{ background: "var(--surface-2)" }}>
                    {e.level}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                    Starts at {e.start}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-bold">{e.title}</h3>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed" style={{ color: "var(--muted)" }}>
                  {e.body}
                </p>
                <p className="ar mt-3 text-sm" lang="ar" dir="rtl">
                  {e.ar}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="eyebrow mb-2">How it works</div>
        <h2 className="font-display text-3xl sm:text-4xl">A clear path, every single day.</h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-4">
          {[
            ["target", "Find your level", "Tell us what you know, or take a 15-minute placement test for a band in all four skills."],
            ["calendar", "Pick your pace", "1 to 12 months. We build a day-by-day plan to your target band, and tell you honestly if it's too tight."],
            ["book", "Learn, then do", "Short daily sessions: a strategy, key words, then a real task with instant feedback."],
            ["trophy", "Arrive exam-ready", "Checkpoint tests and a full mock prove you're ready before test day."],
          ].map(([icon, t, b], i) => (
            <li key={t} className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-md" style={{ background: "var(--brand-soft)", color: "var(--ink)" }}>
                  <Icon name={icon} size={22} />
                </span>
                <span className="num text-2xl font-bold" style={{ color: "var(--muted)" }}>
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
      </section>

      {/* Stages */}
      <section className="border-t py-20" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="eyebrow mb-2">Seven stages</div>
          <h2 className="max-w-2xl font-display text-3xl sm:text-4xl">From the Trailhead to the Summit.</h2>
          {[
            { label: "Foundation · with Arabic explanations", list: foundation },
            { label: "IELTS", list: ielts },
          ].map((g) => (
            <div key={g.label} className="mt-10">
              <h3 className="eyebrow mb-3">{g.label}</h3>
              <div className={`grid gap-4 sm:grid-cols-2 ${g.list.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
                {g.list.map((s) => (
                  <article key={s.id} className="flex flex-col rounded-[10px] border p-5" style={{ borderColor: "var(--line)", background: "var(--bg)" }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="num grid h-9 w-9 place-items-center rounded-full text-sm font-bold" style={{ background: "var(--ink)", color: "var(--bg)" }}>
                        {s.id}
                      </span>
                      <span className="num text-xs font-bold" style={{ color: "var(--muted)" }}>
                        {s.cefr}
                      </span>
                    </div>
                    <div className="eyebrow mt-4">{s.camp}</div>
                    <h4 className="mt-0.5 font-display text-xl">{s.name}</h4>
                    {s.arabic && (
                      <div className="ar text-sm font-bold" lang="ar" dir="rtl" style={{ color: "var(--muted)" }}>
                        {s.arabic.name}
                      </div>
                    )}
                    <p className="mt-3 flex-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                      {s.tagline}
                    </p>
                    <div className="num mt-4 text-sm font-bold">
                      Band {s.bandFrom.toFixed(1)} → {s.bandTo.toFixed(1)}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section className="py-20" style={{ background: "#111316", color: "#f2f2ef" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="eyebrow mb-2" style={{ color: "#a6abb2" }}>
            Four skills, one system
          </div>
          <h2 className="max-w-2xl font-display text-3xl sm:text-4xl">
            Practice that feels like the real test. Feedback that <span style={{ color: "#ffe14d" }}>doesn&apos;t</span>.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {(Object.keys(SKILL_COPY) as Skill[]).map((k) => (
              <div key={k} className="rounded-[10px] p-6" style={{ background: "#1b1d20", border: "1px solid #33363b" }}>
                <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest" style={{ color: SKILL_DARK[k] }}>
                  <Icon name={SKILL_META[k].icon} size={18} /> {SKILL_META[k].label}
                </span>
                <h3 className="mt-3 text-xl font-bold">{SKILL_COPY[k].title}</h3>
                <p className="mt-2 leading-relaxed" style={{ color: "#a6abb2" }}>
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
        <h2 className="max-w-2xl font-display text-3xl sm:text-4xl">How fast do you want to climb?</h2>
        <p className="mt-3 max-w-2xl" style={{ color: "var(--muted)" }}>
          Every plan covers your path to your target band. The difference is how much you do each day. Starting from zero? Choose 9 or 12 months:
          we&apos;ll be honest if a plan is too tight. Fall behind? One tap builds a catch-up plan.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => {
            const tag = p.months === 3 ? "Most popular" : p.months === 12 ? "From zero" : null;
            return (
              <div key={p.months} className="card relative flex flex-col p-5" style={tag ? { borderColor: "var(--ink)", borderWidth: 1.5 } : undefined}>
                {tag && (
                  <span className="chip absolute -top-3 left-5" style={{ background: "var(--highlighter)", color: "var(--on-highlighter)" }}>
                    {tag}
                  </span>
                )}
                <div className="num text-4xl font-bold">
                  {p.months}
                  <span className="ml-1.5 font-sans text-base font-bold" style={{ color: "var(--muted)" }}>
                    {p.months === 1 ? "month" : "months"}
                  </span>
                </div>
                <div className="mt-1 font-bold">{p.name}</div>
                <div className="mt-4 space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Icon name="calendar" size={15} /> <span className="num">~{p.dailyMinutes >= 60 ? `${p.dailyMinutes / 60}h` : `${p.dailyMinutes} min`}</span> a day
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="chart" size={15} /> {p.expectedGain}
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
        <div className="relative overflow-hidden rounded-[16px] p-8 text-center sm:p-16" style={{ background: "var(--highlighter)", color: "var(--on-highlighter)" }}>
          <h2 className="mx-auto max-w-2xl font-display text-3xl sm:text-5xl">Start where you are. Finish at the band you need.</h2>
          <p className="ar mx-auto mt-4 max-w-xl text-lg font-bold" lang="ar" dir="rtl">
            ابدأ من مستواك، ووصل للدرجة اللي تبيها.
          </p>
          <Link href={cta} className="btn mt-8 px-7 py-4 text-base" style={{ background: "#111316", color: "#ffe14d" }}>
            Find my starting point <Icon name="arrow" size={18} />
          </Link>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
        BandUp · Independent IELTS preparation. IELTS is a registered trademark of its owners; BandUp is not affiliated with them.
      </footer>
    </div>
  );
}

/** Skill colours for the always-dark skills panel (the dark-theme values). */
const SKILL_DARK: Record<Skill, string> = { reading: "#4fd1bf", listening: "#a99cff", writing: "#f5b544", speaking: "#ff8fa8" };
