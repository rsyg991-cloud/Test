import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { VocabReview } from "./VocabReview";

export const metadata: Metadata = { title: "Vocabulary" };

export default async function VocabPage() {
  const user = await requireUser();
  const [due, total, mastered] = await Promise.all([
    prisma.vocabCard.findMany({ where: { userId: user.id, due: { lte: new Date() } }, orderBy: { due: "asc" }, take: 30 }),
    prisma.vocabCard.count({ where: { userId: user.id } }),
    prisma.vocabCard.count({ where: { userId: user.id, interval: { gte: 21 } } }),
  ]);
  return (
    <div>
      <PageHeader
        eyebrow="Spaced repetition"
        title="Vocabulary deck"
        subtitle="Every word you meet in a lesson joins your deck. We show it again just before you'd forget it."
        action={
          <div className="flex gap-3 text-sm font-bold">
            <span className="card px-4 py-2">{total} words</span>
            <span className="card px-4 py-2" style={{ color: "var(--success)" }}>
              {mastered} mastered
            </span>
          </div>
        }
      />
      <VocabReview cards={due.map((c) => ({ id: c.id, word: c.word, definition: c.definition, example: c.example }))} />
    </div>
  );
}
