/**
 * Rollback for Stage 0: moves every learner who starts at Stage 0 onto Stage 1, so nobody is stuck
 * with no path when STAGE0_ENABLED is switched off.
 *
 *   npx tsx scripts/stage0-rollback.ts           # dry run: lists who would change, changes nothing
 *   npx tsx scripts/stage0-rollback.ts --apply   # applies it
 *
 * - Only users with startStage 0 or unlockedStage 0 are touched; a second run changes nothing.
 * - XP, streak, activity days and all Stage 0 rows ("z0-…" LessonProgress and kind "stage0"
 *   Attempts) are kept: the learning happened. They are not on any Stage 1–7 path, so they change no
 *   plan or statistic.
 * - Plan months and start date are kept; the path from Stage 1 is computed from them as for anyone else.
 */
import { PrismaClient } from "@prisma/client";

const apply = process.argv.includes("--apply");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { OR: [{ startStage: 0 }, { unlockedStage: 0 }] },
    select: { id: true, startStage: true, unlockedStage: true },
  });
  console.log(`${apply ? "Applying" : "Dry run"}: ${users.length} learner(s) start at Stage 0.`);
  for (const u of users) {
    const next = { startStage: Math.max(1, u.startStage), unlockedStage: Math.max(1, u.unlockedStage) };
    console.log(`  ${u.id}: startStage ${u.startStage} → ${next.startStage}, unlockedStage ${u.unlockedStage} → ${next.unlockedStage}`);
    if (apply) await prisma.user.update({ where: { id: u.id }, data: next });
  }
  if (!apply && users.length) console.log("Nothing changed. Run again with --apply to apply.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
