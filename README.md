# BandUp — the IELTS climb from B1 to Band 7+

BandUp is a full-stack English learning platform that takes a learner from **B1** to the **highest IELTS band they can reach**, across all four skills — **Reading, Listening, Writing and Speaking** — in **four stages**, on a plan of **1, 2, 3, 4 or 6 months**.

## The learner journey

1. **Placement test (~15 min)** — grammar, reading, listening, a short writing task and a speaking question → a starting band for each skill.
2. **Choose a plan** — 1 month (Sprint) · 2 (Accelerate) · 3 (Balanced) · 4 (Steady Climb) · 6 (Deep Growth). The plan is recommended from the band gap and the exam date, and warns if it would end after the exam.
3. **Climb four stages** (a mountain metaphor runs through the UI):

   | Stage | Camp | Level | Focus |
   |---|---|---|---|
   | 1 Foundation | Base Camp | B1 → B1+ | Test format, skim/scan, Listening Parts 1–2, Task 1 basics, Part 1 fluency |
   | 2 Development | The Ridge | B1+ → B2 | T/F/NG, headings, Part 3 discussions, full Task 2 essays, 2-minute Part 2 |
   | 3 Advanced | High Camp | B2 → C1 | Inference, writer's views, Part 4 lectures, argument depth, abstract Part 3 |
   | 4 Exam Mastery | The Summit | C1 | Timed passages, distractors, Band 8 language, full mock |

   Each stage has 3 units × 4 skills (48 lessons in total) and ends with a **checkpoint test** across all four skills that unlocks the next stage.
4. **Every lesson** = a short strategy ("Skill builder") → key vocabulary flip-cards → a real IELTS-style task → instant feedback.

## What keeps learners going

- **Today screen** with one clear session, a daily-minutes goal ring and a "Start" button.
- **Streaks** with a weekly strip, streak freezes (earned every 7 days), XP.
- **Band tracker**: per-skill estimated band over time against the target line.
- **Journey map** showing exactly where you are on the mountain.
- **Spaced-repetition vocabulary deck** (SM-2) filled automatically from lessons.
- **AI practice drills** (24 extra Writing/Speaking prompts) to fill daily minutes on longer plans.
- **No-guilt catch-up**: if you fall behind, one tap re-paces the plan so today is a fresh start.
- Celebrations (confetti, XP, band) after lessons and checkpoints.

## AI examiner (Claude API)

Writing and Speaking are graded by Claude (`lib/ai/evaluate.ts`) with structured output: a band per official IELTS criterion, strengths, the 3 highest-impact next steps, line-by-line corrections, and the learner's **own answer rewritten one band higher**.

- Speaking uses the browser's microphone (`MediaRecorder`) plus live speech-to-text (Web Speech API; Chrome/Edge). The transcript, speaking time and rate are sent for grading; pronunciation is clearly labelled as an estimate. Other browsers fall back to typing what was said.
- Listening audio is generated in the browser with speech synthesis (two voices, adjustable speed, optional "exam mode: play once").
- The API key stays on the server. Requests use the server-side refusal fallback, and each learner has a daily evaluation limit (`AI_DAILY_LIMIT`).
- Without a key (or with `AI_MOCK=1`) an **offline demo evaluator** gives a rough heuristic estimate, clearly labelled, so the whole app can be tried locally.

## Tech

Next.js 15 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Prisma (SQLite locally, Postgres-ready) · `@anthropic-ai/sdk` · email/password auth with hashed session tokens in httpOnly cookies · Vitest.

```
app/                    pages (landing, auth, onboarding, dashboard, journey, learn, checkpoint, practice, vocab, progress, plan)
app/actions/            server actions (auth, onboarding, lessons/checkpoints, vocab & plan)
app/api/evaluate/       AI grading endpoint
components/             UI, journey map, charts, lesson player, task views (reading/listening/writing/speaking)
content/                the curriculum: 4 stages, 48 lessons, 4 checkpoints, placement test, practice prompts
lib/plan/scheduler.ts   plan pacing, review days, catch-up, plan recommendation
lib/scoring.ts          answer checking, IELTS band rounding, band estimates
lib/srs.ts              spaced repetition
lib/ai/                 Claude evaluator, schema, offline demo evaluator
prisma/                 schema + demo seed
```

## Run it

```bash
npm install
cp .env.example .env        # add ANTHROPIC_API_KEY for real AI grading, or set AI_MOCK=1
npm run setup               # create the database and seed a demo learner
npm run dev                 # http://localhost:3000
```

Demo learner: `demo@bandup.app` / `demo12345` (3 weeks of history, streak and bands).

Checks:

```bash
npm run typecheck
npm test                    # scheduler, scoring, SRS, curriculum integrity, evaluator
npm run build
BASE_URL=http://localhost:3000 npm run e2e   # browser smoke test: register → placement → plan → lesson → dashboard
```

For production, switch the Prisma datasource to `postgresql`, set `DATABASE_URL`, and deploy as a standard Next.js app.

*IELTS is a registered trademark of its owners. BandUp is an independent preparation tool and is not affiliated with them.*
