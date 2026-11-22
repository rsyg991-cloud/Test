import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { allLessons } from "@/content";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { VocabReview } from "./VocabReview";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("meta.vocab") };
}

/** Arabic meanings from the foundation stages, shown under the English definition. */
const ARABIC_MEANING = new Map(allLessons.flatMap((l) => l.vocab.filter((v) => v.ar).map((v) => [v.word, v.ar!] as const)));

export default async function VocabPage() {
  const user = await requireUser();
  const { t } = await getT();
  const [due, total, mastered] = await Promise.all([
    prisma.vocabCard.findMany({ where: { userId: user.id, due: { lte: new Date() } }, orderBy: { due: "asc" }, take: 30 }),
    prisma.vocabCard.count({ where: { userId: user.id } }),
    prisma.vocabCard.count({ where: { userId: user.id, interval: { gte: 21 } } }),
  ]);
  return (
    <div>
      <PageHeader
        eyebrow={t("vocab.eyebrow")}
        title={t("vocab.title")}
        subtitle={t("vocab.subtitle")}
        action={
          <div className="flex gap-3 text-sm font-bold">
            <span className="card px-4 py-2">{t("vocab.words", { n: total })}</span>
            <span className="card px-4 py-2" style={{ color: "var(--success)" }}>
              {t("vocab.mastered", { n: mastered })}
            </span>
          </div>
        }
      />
      <VocabReview cards={due.map((c) => ({ id: c.id, word: c.word, definition: c.definition, example: c.example, ar: ARABIC_MEANING.get(c.word) }))} />
    </div>
  );
}
