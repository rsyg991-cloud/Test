/**
 * Seeds a demo learner with a few weeks of realistic history so the dashboard,
 * band chart and streak can be explored immediately.
 *   email: demo@bandup.app   password: demo12345
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { curriculumFrom } from "../content";

const prisma = new PrismaClient();
const DAY = 86_400_000;
const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const utcMidnight = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

async function main() {
  const email = "demo@bandup.app";
  await prisma.user.deleteMany({ where: { email } });

  const today = utcMidnight(new Date());
  const planStart = new Date(today.getTime() - 20 * DAY);
  const user = await prisma.user.create({
    data: {
      email,
      name: "Sara",
      passwordHash: await bcrypt.hash("demo12345", 10),
      targetBand: 7,
      examDate: new Date(today.getTime() + 75 * DAY),
      planMonths: 3,
      planStart,
      placementDone: true,
      xp: 1240,
      streak: 9,
      longestStreak: 12,
      lastActiveDay: dayKey(new Date(today.getTime() - DAY)),
      streakFreezes: 1,
    },
  });

  // Placement snapshot 20 days ago.
  const placement = { reading: 5.5, listening: 5.5, writing: 5, speaking: 5 };
  for (const [skill, band] of Object.entries(placement)) {
    await prisma.bandSnapshot.create({ data: { userId: user.id, skill, band, source: "placement", createdAt: planStart } });
  }

  // First 9 lessons completed with gradually improving bands.
  const items = curriculumFrom(1).filter((i) => i.kind === "lesson").slice(0, 9);
  const bandFor: Record<string, number[]> = {
    reading: [5.5, 6, 6],
    listening: [5.5, 6, 6],
    writing: [5.5, 5.5, 6],
    speaking: [5, 5.5, 5.5],
  };
  const seen: Record<string, number> = {};
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.kind !== "lesson") continue;
    const skill = it.lesson.skill;
    const band = bandFor[skill][Math.min(2, seen[skill] ?? 0)];
    seen[skill] = (seen[skill] ?? 0) + 1;
    const at = new Date(planStart.getTime() + (i * 2 + 1) * DAY + 18 * 3600_000);
    await prisma.lessonProgress.create({
      data: { userId: user.id, lessonId: it.id, stage: it.stage, skill, bestScore: 0.6 + i * 0.03, band, completedAt: at },
    });
    await prisma.bandSnapshot.create({ data: { userId: user.id, skill, band, source: "lesson", createdAt: at } });
    for (const w of it.lesson.vocab) {
      await prisma.vocabCard.upsert({
        where: { userId_word: { userId: user.id, word: w.word } },
        create: { userId: user.id, word: w.word, definition: w.definition, example: w.example, due: new Date(today.getTime() - (i % 3) * DAY) },
        update: {},
      });
    }
  }

  // Activity for the last 20 days (with a couple of gaps).
  for (let k = 20; k >= 1; k--) {
    if (k === 13 || k === 14) continue;
    const d = new Date(today.getTime() - k * DAY);
    await prisma.activityDay.create({ data: { userId: user.id, day: dayKey(d), xp: 40 + ((k * 13) % 50), minutes: 25 + ((k * 17) % 45), tasks: 2 } });
  }

  console.log(`Seeded demo learner: ${email} / demo12345`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
