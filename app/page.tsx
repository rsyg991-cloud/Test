import Link from "next/link";
import { allLessons, stages } from "@/content";
import { Icon } from "@/components/icons";
import { JourneyMap } from "@/components/JourneyMap";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { Logo, SKILL_META } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { PLANS } from "@/lib/plan/scheduler";
import type { Skill } from "@/content/types";

const SKILLS: Skill[] = ["reading", "listening", "writing", "speaking"];
const ENTRY_POINTS = [
  { id: "a0", level: "A0", ar: "تبدأ من الصفر؟ نشرح لك كل خطوة بالعربي." },
  { id: "a1", level: "A1–A2", ar: "تعرف الأساسيات؟ نبني عليها حتى تدخل الاختبار." },
  { id: "b1", level: "B1+", ar: "مستواك متوسط أو أعلى؟ ابدأ باختبار تحديد المستوى." },
] as const;
const HOW = [
  ["target", "level"],
  ["calendar", "pace"],
  ["book", "learn"],
  ["trophy", "ready"],
] as const;

export default async function Home() {
  const user = await getCurrentUser();
  const { t, rich, stage, planText, duration, plural, locale } = await getT();
  const en = locale === "en"; // English pages also carry a few Arabic lines for Gulf readers.
  const demoStages = stages.map((s) => ({
    id: s.id,
    name: stage(s.id, "name"),
    camp: stage(s.id, "camp"),
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
          <LanguageSwitch />
          {user ? (
            <Link href="/dashboard" className="btn btn-primary">
              {t("landing.continue")} <Icon name="arrow" size={18} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost hidden px-4 sm:inline-flex">
                {t("landing.login")}
              </Link>
              <Link href="/register" className="btn btn-primary px-4">
                {t("landing.startFree")}
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-8 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:pt-14">
        <div className="animate-rise min-w-0">
          <div className="eyebrow mb-4">{t("landing.eyebrow")}</div>
          <h1 className="font-display text-[2.6rem] leading-[1.05] sm:text-6xl lg:text-[4.1rem]">{rich("landing.headline")}</h1>
          {en && (
            <p className="ar mt-4 text-xl font-bold" lang="ar" dir="rtl">
              من الصفر إلى الدرجة اللي تحتاجها.
            </p>
          )}
          <p className="mt-4 max-w-xl text-lg leading-relaxed" style={{ color: "var(--muted)" }}>
            {t("landing.intro")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={cta} className="btn btn-primary px-6 py-3.5 text-base">
              {t("landing.cta")} <Icon name="arrow" size={18} />
            </Link>
            <span className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
              {t("landing.ctaNote")}
            </span>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
            {[
              [String(stages.length), t("landing.statStages")],
              [String(allLessons.length), t("landing.statLessons")],
              ["24/7", t("landing.statAi")],
            ].map(([n, l]) => (
              <div key={l} className="border-s-2 ps-3" style={{ borderColor: "var(--line)" }}>
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
          <div className="card animate-rise absolute -end-3 top-6 hidden w-56 p-4 sm:block" style={{ animationDelay: ".2s", boxShadow: "var(--shadow)" }}>
            <div className="eyebrow">{t("landing.estimatedOverall")}</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="num text-4xl font-bold">4.5</span>
              <span className="text-sm font-bold" style={{ color: "var(--success)" }}>
                {t("landing.fromZero")}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Start where you are */}
      <section className="ruled border-y py-20" style={{ borderColor: "var(--line)" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="eyebrow mb-2">{t("landing.startEyebrow")}</div>
          <h2 className="max-w-2xl font-display text-3xl sm:text-4xl">{t("landing.startTitle")}</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {ENTRY_POINTS.map((e) => (
              <article key={e.id} className="card flex flex-col p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="num rounded-md px-2.5 py-1 text-sm font-bold" style={{ background: "var(--surface-2)" }} dir="ltr">
                    {e.level}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                    {t("landing.startsAt", { stage: t(`landing.entry.${e.id}.start`) })}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-bold">{t(`landing.entry.${e.id}.title`)}</h3>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed" style={{ color: "var(--muted)" }}>
                  {t(`landing.entry.${e.id}.body`)}
                </p>
                {en && (
                  <p className="ar mt-3 text-sm" lang="ar" dir="rtl">
                    {e.ar}
                  </p>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="eyebrow mb-2">{t("landing.howEyebrow")}</div>
        <h2 className="font-display text-3xl sm:text-4xl">{t("landing.howTitle")}</h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-4">
          {HOW.map(([icon, key], i) => (
            <li key={key} className="card p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-md" style={{ background: "var(--brand-soft)", color: "var(--ink)" }}>
                  <Icon name={icon} size={22} />
                </span>
                <span className="num text-2xl font-bold" style={{ color: "var(--muted)" }}>
                  0{i + 1}
                </span>
              </div>
              <h3 className="text-lg font-bold">{t(`landing.how.${key}.title`)}</h3>
              <p className="mt-1 text-[15px]" style={{ color: "var(--muted)" }}>
                {t(`landing.how.${key}.body`)}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Stages */}
      <section className="border-t py-20" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="eyebrow mb-2">{t("landing.stagesEyebrow")}</div>
          <h2 className="max-w-2xl font-display text-3xl sm:text-4xl">{t("landing.stagesTitle")}</h2>
          {[
            { label: t("landing.groupFoundation"), list: foundation },
            { label: t("landing.groupIelts"), list: ielts },
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
                      <span className="num text-xs font-bold" style={{ color: "var(--muted)" }} dir="ltr">
                        {s.cefr}
                      </span>
                    </div>
                    <div className="eyebrow mt-4">{stage(s.id, "camp")}</div>
                    <h4 className="mt-0.5 font-display text-xl">{stage(s.id, "name")}</h4>
                    {en && s.arabic && (
                      <div className="ar text-sm font-bold" lang="ar" dir="rtl" style={{ color: "var(--muted)" }}>
                        {s.arabic.name}
                      </div>
                    )}
                    <p className="mt-3 flex-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                      {stage(s.id, "tagline")}
                    </p>
                    <div className="num mt-4 text-sm font-bold" dir="ltr">
                      {t("landing.bandRange", { from: s.bandFrom.toFixed(1), to: s.bandTo.toFixed(1) })}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section className="py-20" style={{ background: "#0a2540", color: "#eaf5fd" }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="eyebrow mb-2" style={{ color: "#9bb2c6" }}>
            {t("landing.skillsEyebrow")}
          </div>
          <h2 className="max-w-2xl font-display text-3xl sm:text-4xl">{rich("landing.skillsTitle")}</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {SKILLS.map((k) => (
              <div key={k} className="rounded-[10px] p-6" style={{ background: "#0f2f4d", border: "1px solid #23466a" }}>
                <span className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest" style={{ color: SKILL_DARK[k] }}>
                  <Icon name={SKILL_META[k].icon} size={18} /> {t(`skills.${k}`)}
                </span>
                <h3 className="mt-3 text-xl font-bold">{t(`landing.skillCopy.${k}.title`)}</h3>
                <p className="mt-2 leading-relaxed" style={{ color: "#9bb2c6" }}>
                  {t(`landing.skillCopy.${k}.body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="eyebrow mb-2">{t("landing.plansEyebrow")}</div>
        <h2 className="max-w-2xl font-display text-3xl sm:text-4xl">{t("landing.plansTitle")}</h2>
        <p className="mt-3 max-w-2xl" style={{ color: "var(--muted)" }}>
          {t("landing.plansBody")}
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => {
            const tag = p.months === 3 ? t("landing.mostPopular") : p.months === 12 ? t("landing.fromZeroTag") : null;
            return (
              <div key={p.months} className="card relative flex flex-col p-5" style={tag ? { borderColor: "var(--ink)", borderWidth: 1.5 } : undefined}>
                {tag && (
                  <span className="chip absolute -top-3 start-5" style={{ background: "var(--highlighter)", color: "var(--on-highlighter)" }}>
                    {tag}
                  </span>
                )}
                <div className="text-4xl font-bold">
                  <span className="num">{p.months}</span>
                  <span className="ms-1.5 font-sans text-base font-bold" style={{ color: "var(--muted)" }}>
                    {plural("common.monthUnit", p.months)}
                  </span>
                </div>
                <div className="mt-1 font-bold">{planText(p.months, "name")}</div>
                <div className="mt-4 space-y-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Icon name="calendar" size={15} /> {t("common.about")}{duration(p.dailyMinutes)} {t("common.perDay")}
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="chart" size={15} /> {planText(p.months, "gain")}
                  </div>
                </div>
                <p className="mt-4 text-sm" style={{ color: "var(--muted)" }}>
                  {planText(p.months, "bestFor")}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-[16px] p-8 text-center sm:p-16" style={{ background: "var(--highlighter)", color: "var(--on-highlighter)" }}>
          <h2 className="mx-auto max-w-2xl font-display text-3xl sm:text-5xl">{t("landing.finalTitle")}</h2>
          {en && (
            <p className="ar mx-auto mt-4 max-w-xl text-lg font-bold" lang="ar" dir="rtl">
              ابدأ من مستواك، ووصل للدرجة اللي تبيها.
            </p>
          )}
          <Link href={cta} className="btn btn-primary mt-8 px-7 py-4 text-base">
            {t("landing.cta")} <Icon name="arrow" size={18} />
          </Link>
        </div>
      </section>

      <footer className="border-t px-4 py-8 text-center text-sm" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>
        {t("landing.footer")}
      </footer>
    </div>
  );
}

/** Skill colours for the always-dark skills panel (the dark-theme values). */
const SKILL_DARK: Record<Skill, string> = { reading: "#4fd1bf", listening: "#a99cff", writing: "#f5b544", speaking: "#ff8fa8" };
