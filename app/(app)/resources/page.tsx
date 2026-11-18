import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Official resources" };

const OFFICIAL = [
  {
    name: "British Council — free IELTS practice",
    url: "https://takeielts.britishcouncil.org/",
    where: "Prepare → Free practice tests",
    what: "Free full practice tests for all four skills from a co-owner of IELTS, plus a familiarisation test that shows the computer-delivered format.",
    when: "Use after Stage 2 to check your timing on real-format tests.",
  },
  {
    name: "IDP IELTS — free practice tests",
    url: "https://ielts.idp.com/",
    where: "Prepare → Free practice tests (choose Academic)",
    what: "Official practice tests organised by section and question type, from a co-owner of IELTS.",
    when: "Use any time you want extra practice on one question type.",
  },
  {
    name: "IELTS.org — sample questions & band descriptors",
    url: "https://ielts.org/",
    where: "Prepare → Sample test questions · Results → Band descriptors",
    what: "Official sample questions for every section, the exact test format, and the public band descriptors examiners use for Writing and Speaking.",
    when: "Read the Writing and Speaking band descriptors once you reach Stage 3.",
  },
  {
    name: "Cambridge IELTS 1–19 (Academic) — official books",
    url: "https://www.cambridge.org/",
    where: "Search “Cambridge IELTS Academic”",
    what: "Authentic past examination papers from Cambridge University Press & Assessment, with audio and answer keys. Each book has four complete tests.",
    when: "Best for your final 4–6 weeks: one full test per week under timed conditions. Buy the book or use Cambridge One — don't use pirated PDFs.",
  },
];

export default async function ResourcesPage() {
  await requireUser();
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Trusted sources"
        title="Official IELTS resources"
        subtitle="BandUp's lessons and mock test are original material written in the official format. For authentic past papers, use only the official sources below."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {OFFICIAL.map((r) => (
          <article key={r.name} className="card flex flex-col p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: "color-mix(in srgb, var(--success) 14%, transparent)", color: "var(--success)" }}>
                <Icon name="shield" size={20} />
              </span>
              <div>
                <h2 className="font-bold">{r.name}</h2>
                <p className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
                  {r.where}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm">{r.what}</p>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              <b>When:</b> {r.when}
            </p>
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost mt-4 self-start px-4 py-2 text-sm">
              Open {new URL(r.url).hostname.replace(/^www\./, "")} <Icon name="arrow" size={14} />
            </a>
          </article>
        ))}
      </div>

      <section className="card p-5 sm:p-6" style={{ borderColor: "var(--writing)" }}>
        <h2 className="flex items-center gap-2 font-display text-xl font-bold">
          <Icon name="shield" size={20} style={{ color: "var(--writing)" }} /> Be careful with “free past papers” websites
        </h2>
        <p className="mt-2 text-sm leading-relaxed">
          Many sites publish copies of Cambridge IELTS tests without permission. Besides the copyright problem, these copies often have wrong answer keys, missing audio or altered questions — which can give you a false band score. If a site offers “real recent exam questions” or “leaked tests”, avoid it.
        </p>
      </section>

      <section className="card flex flex-wrap items-center gap-4 p-5 sm:p-6">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-bold">Ready for the real format?</h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Take BandUp&apos;s full mock test: 40 listening + 40 reading questions, two writing tasks and three speaking parts, with official timing.
          </p>
        </div>
        <Link href="/practice#mock-tests" className="btn btn-primary">
          Full mock test <Icon name="arrow" size={16} />
        </Link>
      </section>
    </div>
  );
}
