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
- **AI Conversations** (20 role-plays, 5 per stage) — see below.
- **AI practice drills** (24 extra Writing/Speaking prompts) to fill daily minutes on longer plans.
- **No-guilt catch-up**: if you fall behind, one tap re-paces the plan so today is a fresh start.
- Celebrations (confetti, XP, band) after lessons and checkpoints.

## AI Conversations — learn first, then talk with ChatGPT

20 speaking role-plays (5 per stage, from "Meeting a New Classmate" to full mock speaking tests and C1 discussions) in `content/conversations/`. Each one has five steps:

1. **Learn** — goals, 5 key phrases with examples, a grammar focus, vocabulary flip-cards.
2. **Listen** — a model dialogue played with two voices, with transcript.
3. **Check** — 3 quick questions; 2/3 unlocks the conversation.
4. **Talk** — a ready-made ChatGPT prompt (`lib/conversation/prompt.ts`) that sets the role, the learner's level, the target phrases and missions, keeps ChatGPT's replies short, avoids mid-conversation corrections and ends with feedback when the learner says "END". One tap copies it; another opens ChatGPT (voice mode recommended).
5. **Reflect** — a self-check list, then paste the conversation back for BandUp feedback on the learner's turns (fluency & interaction, vocabulary, grammar, use of target language). Completing adds XP, streak, vocabulary and a speaking band estimate.

They live on the Practice page, and the dashboard suggests one each day.

## Full IELTS mock test & official format

- **Full mock test** (`/mock/original-test-1`): a complete IELTS Academic test written for BandUp in the official format — 4 listening parts (40 questions, each recording plays once, map labelling), 3 reading passages (40 questions, ≈2,350 words, 60 minutes), Writing Task 1 + Task 2 (60 minutes, Task 2 counts double) and a 3-part speaking test. Timers auto-submit, progress survives a reload, answers are graded on the server (never sent to the browser), and results show bands from the published conversion tables, accuracy by question type and a full answer review.
- **All official question types**: multiple choice (one / choose TWO), True/False/Not Given, Yes/No/Not Given, matching (headings, features, sentence endings), note/form/summary completion with word limits, summary with a word box, map/diagram labelling, short answer (`lib/mock/`).
- **Licensed past papers**: the engine can load authentic tests (e.g. Cambridge IELTS) with real audio once you have a licence — see **[docs/licensed-tests.md](docs/licensed-tests.md)**. `npm run validate:tests` checks every test file. Licensed files are git-ignored.
- **Resources page** (`/resources`): links to the official free practice tests (British Council, IDP, IELTS.org) and the Cambridge books, with a warning about pirated "past paper" sites.

The 48 lessons and stage checkpoints are original practice material in IELTS style; they are shorter than the real test by design (they teach one skill at a time).

## AI evaluation: n8n webhook, Claude or demo

All evaluation goes through one request shape with three interchangeable providers (`lib/ai/evaluate.ts`), chosen with `AI_PROVIDER` or automatically:

- **n8n webhook** (`N8N_EVAL_WEBHOOK_URL`, optional `N8N_WEBHOOK_SECRET`) — connect any model, including free ones. Full request/response contract and workflow steps: **[docs/n8n.md](docs/n8n.md)**.
- **Claude API** (`ANTHROPIC_API_KEY`).
- **Offline demo evaluator** — used when neither is configured, clearly labelled.

### Claude provider details

Writing and Speaking are graded by Claude (`lib/ai/evaluate.ts`) with structured output: a band per official IELTS criterion, strengths, the 3 highest-impact next steps, line-by-line corrections, and the learner's **own answer rewritten one band higher**.

- Speaking uses the browser's microphone (`MediaRecorder`) plus live speech-to-text (Web Speech API; Chrome/Edge). The transcript, speaking time and rate are sent for grading; pronunciation is clearly labelled as an estimate. Other browsers fall back to typing what was said.
- Listening audio is generated in the browser with speech synthesis (two voices, adjustable speed, optional "exam mode: play once").
- The API key stays on the server. Requests use the server-side refusal fallback, and each learner has a daily evaluation limit (`AI_DAILY_LIMIT`).
- With no evaluator configured (or with `AI_MOCK=1`) the **offline demo evaluator** gives a rough heuristic estimate, clearly labelled, so the whole app can be tried locally.

## Tech

Next.js 15 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Prisma (SQLite locally, Postgres-ready) · `@anthropic-ai/sdk` · email/password auth with hashed session tokens in httpOnly cookies · Vitest.

```
app/                    pages (landing, auth, onboarding, dashboard, journey, learn, checkpoint, practice, vocab, progress, plan)
app/actions/            server actions (auth, onboarding, lessons/checkpoints, vocab & plan)
app/api/evaluate/       AI grading endpoint
components/             UI, journey map, charts, lesson player, task views (reading/listening/writing/speaking)
content/                the curriculum: 4 stages, 48 lessons, 4 checkpoints, placement test, practice prompts
content/conversations/  20 AI-conversation role-plays (learn-first material + role-play setup)
lib/plan/scheduler.ts   plan pacing, review days, catch-up, plan recommendation
lib/scoring.ts          answer checking, IELTS band rounding, band estimates
lib/srs.ts              spaced repetition
lib/ai/                 evaluator providers (n8n webhook, Claude, offline demo), schema, response parsing
lib/conversation/       ChatGPT role-play prompt builder
lib/mock/               full-test schema, grading rules, band tables, validator, test registry
content/mock/           full mock tests (original); licensed tests go in MOCK_TESTS_DIR
docs/n8n.md             n8n integration guide
docs/licensed-tests.md  how to license and import authentic IELTS tests
prisma/                 schema + demo seed
```

## Run it

```bash
npm install
cp .env.example .env        # set N8N_EVAL_WEBHOOK_URL (or ANTHROPIC_API_KEY) for real AI grading
npm run setup               # create the database and seed a demo learner
npm run dev                 # http://localhost:3000
```

Demo learner: `demo@bandup.app` / `demo12345` (3 weeks of history, streak and bands).

Checks:

```bash
npm run typecheck
npm test                    # scheduler, scoring, SRS, curriculum & conversation integrity, prompt builder, webhook parsing, mock grading & validator
npm run validate:tests      # validate all full tests (built-in + licensed)
npm run build
BASE_URL=http://localhost:3000 npm run e2e   # browser smoke test: register → placement → plan → lesson → AI conversation → full mock test → dashboard
```

For production, switch the Prisma datasource to `postgresql`, set `DATABASE_URL`, and deploy as a standard Next.js app.

*IELTS is a registered trademark of its owners. BandUp is an independent preparation tool and is not affiliated with them.*
