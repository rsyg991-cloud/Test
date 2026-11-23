import "server-only";
import { prisma } from "@/lib/db";
import type { Support } from "@/lib/learning/gates";
import { readFeedback } from "./feedback";

export { isStage1Ref, supportedMinWords } from "./feedback";

/**
 * Stage 1 supports for a learner who came through Stage 0 with a weak skill (soft gates).
 * Read from the learner's latest Stage 0 unit check, so no new table is needed. They apply to
 * Stage 1 only and switch off once Stage 2 is open; the Stage 2 gate itself asks for the full
 * writing minimum, so a weakness can't be carried forward for ever.
 */
export async function stage1Supports(user: { id: string; startStage: number; unlockedStage: number }): Promise<Support[]> {
  if (user.startStage !== 0 || user.unlockedStage > 1) return [];
  const check = await prisma.attempt.findFirst({
    where: { userId: user.id, kind: "stage0", refId: { endsWith: "-check" } },
    orderBy: { createdAt: "desc" },
    select: { feedbackJson: true },
  });
  return readFeedback(check?.feedbackJson).gate?.supports ?? [];
}
