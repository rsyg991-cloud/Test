import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("meta.resources") };
}

const OFFICIAL = [
  {
    id: "bc",
    name: "British Council — free IELTS practice",
    url: "https://takeielts.britishcouncil.org/",
    where: "Prepare → Free practice tests",
  },
  {
    id: "idp",
    name: "IDP IELTS — free practice tests",
    url: "https://ielts.idp.com/",
    where: "Prepare → Free practice tests (choose Academic)",
  },
  {
    id: "org",
    name: "IELTS.org — sample questions & band descriptors",
    url: "https://ielts.org/",
    where: "Prepare → Sample test questions · Results → Band descriptors",
  },
  {
    id: "cambridge",
    name: "Cambridge IELTS 1–19 (Academic) — official books",
    url: "https://www.cambridge.org/",
    where: "Search “Cambridge IELTS Academic”",
  },
] as const;

export default async function ResourcesPage() {
  await requireUser();
  const { t } = await getT();
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("resources.eyebrow")}
        title={t("resources.title")}
        subtitle={t("resources.subtitle")}
      />

      <div className="grid gap-4 md:grid-cols-2">
        {OFFICIAL.map((r) => (
          <article key={r.name} className="card flex flex-col p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md" style={{ background: "color-mix(in srgb, var(--success) 14%, transparent)", color: "var(--success)" }}>
                <Icon name="shield" size={20} />
              </span>
              <div>
                <h2 className="font-bold" dir="ltr">
                  {r.name}
                </h2>
                <p className="text-xs font-semibold" style={{ color: "var(--muted)" }} dir="ltr">
                  {r.where}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm">{t(`resources.items.${r.id}.what`)}</p>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
              <b>{t("resources.when")}</b> {t(`resources.items.${r.id}.when`)}
            </p>
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost mt-4 self-start px-4 py-2 text-sm">
              {t("resources.open", { host: new URL(r.url).hostname.replace(/^www\./, "") })} <Icon name="arrow" size={14} />
            </a>
          </article>
        ))}
      </div>

      <section className="card p-5 sm:p-6" style={{ borderColor: "var(--writing)" }}>
        <h2 className="flex items-center gap-2 font-display text-xl">
          <Icon name="shield" size={20} style={{ color: "var(--writing)" }} /> {t("resources.warnTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed">{t("resources.warnBody")}</p>
      </section>

      <section className="card flex flex-wrap items-center gap-4 p-5 sm:p-6">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl">{t("resources.readyTitle")}</h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {t("resources.readyBody")}
          </p>
        </div>
        <Link href="/practice#mock-tests" className="btn btn-primary">
          {t("resources.readyCta")} <Icon name="arrow" size={16} />
        </Link>
      </section>
    </div>
  );
}
