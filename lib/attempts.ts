import "server-only";
import { prisma } from "@/lib/db";

/** Load an AI-evaluated attempt and make sure it belongs to this learner and task. */
export async function loadOwnedAttempt(
  userId: string,
  attemptId: string | undefined,
  expect: { refId: string; skill: "writing" | "speaking" | "conversation" },
) {
  if (!attemptId) return null;
  const a = await prisma.attempt.findUnique({ where: { id: attemptId } });
  if (!a || a.userId !== userId || a.refId !== expect.refId || a.skill !== expect.skill || a.band === null) return null;
  return a;
}
