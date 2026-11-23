import { getT } from "@/lib/i18n/server";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCheckpoint, getConversation, getLesson, getPractice, type SpeakingTask, type WritingTask } from "@/content";
import { placement } from "@/content/placement";
import { aiEnabled, evaluateConversation, evaluateSpeaking, evaluateWriting } from "@/lib/ai/evaluate";
import { WebhookError } from "@/lib/ai/webhook";
import { getMockSpeakingPart, getMockWritingTask } from "@/lib/mock/registry";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { aiUsageToday } from "@/lib/progress";
import { stage1Supports, supportedMinWords } from "@/lib/stage0/supports";

export const maxDuration = 60;

const Body = z.object({
  kind: z.enum(["writing", "speaking", "conversation"]),
  source: z.enum(["lesson", "checkpoint", "practice", "placement", "conversation", "mock"]),
  refId: z.string().max(64),
  text: z.string().max(20000),
  durationSec: z.number().min(0).max(1200).optional(),
});

function resolveTask(source: string, refId: string, kind: "writing" | "speaking" | "conversation"): WritingTask | SpeakingTask | undefined {
  if (kind === "conversation") return undefined;
  if (source === "placement") return placement[kind];
  if (source === "lesson") return getLesson(refId)?.[kind];
  if (source === "checkpoint") return getCheckpoint(refId)?.[kind];
  if (source === "practice") return getPractice(refId)?.[kind];
  if (source === "mock") {
    if (kind === "writing") {
      const t = getMockWritingTask(refId);
      return t && { ...t, timeMinutes: t.task === "task1" ? 20 : 40, tips: [] };
    }
    return getMockSpeakingPart(refId);
  }
  return undefined;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: (await getT()).t("errors.loginAgain") }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: (await getT()).t("errors.invalidRequest") }, { status: 400 });
  const { kind, source, refId, text, durationSec = 0 } = parsed.data;

  const scenario = kind === "conversation" ? getConversation(refId) : undefined;
  const task = kind === "conversation" ? undefined : resolveTask(source, refId, kind);
  if (kind === "conversation" ? !scenario || source !== "conversation" : !task) {
    return NextResponse.json({ error: (await getT()).t("errors.taskNotFound") }, { status: 404 });
  }
  if (scenario && scenario.stage > user.unlockedStage) {
    return NextResponse.json({ error: (await getT()).t("errors.conversationLocked") }, { status: 403 });
  }

  const words = text.trim().split(/\s+/).filter(Boolean).length;
  // Stage 1 learners who came through Stage 0 with weak writing get a lower minimum (15, or 30 at the
  // checkpoint): the server enforces the minimum for their stage and supports, not a fixed 20.
  let writingTask = kind === "writing" ? (task as WritingTask) : undefined;
  let minWriting = 20;
  if (writingTask && (source === "lesson" || source === "checkpoint")) {
    const supported = supportedMinWords(writingTask.minWords, await stage1Supports(user), refId);
    if (supported < writingTask.minWords) {
      writingTask = { ...writingTask, minWords: supported };
      minWriting = Math.min(minWriting, supported);
    }
  }
  if (kind === "writing" && words < minWriting) {
    return NextResponse.json({ error: (await getT()).t("errors.minWords") }, { status: 400 });
  }
  if (kind === "conversation" && words < 30) {
    return NextResponse.json({ error: (await getT()).t("errors.minConversation") }, { status: 400 });
  }
  if (kind === "speaking" && words < 8) {
    return NextResponse.json({ error: (await getT()).t("errors.minSpeech") }, { status: 400 });
  }

  const limit = Number(process.env.AI_DAILY_LIMIT || 30);
  if (aiEnabled() && (await aiUsageToday(user.id)) >= limit) {
    return NextResponse.json(
      { error: (await getT()).t("errors.dailyLimit", { limit }) },
      { status: 429 },
    );
  }

  try {
    const evaluation =
      kind === "conversation"
        ? await evaluateConversation(scenario!, text)
        : kind === "writing"
          ? await evaluateWriting(writingTask!, text)
          : await evaluateSpeaking(task as SpeakingTask, text, durationSec);

    const attempt = await prisma.attempt.create({
      data: {
        userId: user.id,
        kind: source,
        refId,
        skill: kind,
        band: evaluation.overall_band,
        responseJson: JSON.stringify({ text, durationSec }),
        feedbackJson: JSON.stringify(evaluation),
        aiGraded: !evaluation.demo,
      },
    });
    return NextResponse.json({ attemptId: attempt.id, evaluation });
  } catch (err) {
    console.error("[evaluate]", err);
    if (err instanceof WebhookError) return NextResponse.json({ error: err.message }, { status: 502 });
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: (await getT()).t("errors.aiBusy") }, { status: 503 });
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: (await getT()).t("errors.aiNotConfigured") }, { status: 500 });
    }
    if (err instanceof Anthropic.APIConnectionError) {
      return NextResponse.json({ error: (await getT()).t("errors.aiUnreachable") }, { status: 503 });
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: (await getT()).t("errors.aiFailed") }, { status: 502 });
    }
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
