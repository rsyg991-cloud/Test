import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCheckpoint, getConversation, getLesson, getPractice, type SpeakingTask, type WritingTask } from "@/content";
import { placement } from "@/content/placement";
import { aiEnabled, evaluateConversation, evaluateSpeaking, evaluateWriting } from "@/lib/ai/evaluate";
import { WebhookError } from "@/lib/ai/webhook";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { aiUsageToday } from "@/lib/progress";

export const maxDuration = 120;

const Body = z.object({
  kind: z.enum(["writing", "speaking", "conversation"]),
  source: z.enum(["lesson", "checkpoint", "practice", "placement", "conversation"]),
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
  return undefined;
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { kind, source, refId, text, durationSec = 0 } = parsed.data;

  const scenario = kind === "conversation" ? getConversation(refId) : undefined;
  const task = kind === "conversation" ? undefined : resolveTask(source, refId, kind);
  if (kind === "conversation" ? !scenario || source !== "conversation" : !task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }
  if (scenario && scenario.stage > user.unlockedStage) {
    return NextResponse.json({ error: "This conversation is still locked." }, { status: 403 });
  }

  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (kind === "writing" && words < 20) {
    return NextResponse.json({ error: "Write at least 20 words so there's enough to assess." }, { status: 400 });
  }
  if (kind === "conversation" && words < 30) {
    return NextResponse.json({ error: "Paste the whole conversation (at least a few exchanges) so there's enough to assess." }, { status: 400 });
  }
  if (kind === "speaking" && words < 8) {
    return NextResponse.json({ error: "We couldn't hear enough to assess. Try speaking for longer." }, { status: 400 });
  }

  const limit = Number(process.env.AI_DAILY_LIMIT || 30);
  if (aiEnabled() && (await aiUsageToday(user.id)) >= limit) {
    return NextResponse.json(
      { error: `You've reached today's limit of ${limit} AI evaluations. It resets at midnight (UTC).` },
      { status: 429 },
    );
  }

  try {
    const evaluation =
      kind === "conversation"
        ? await evaluateConversation(scenario!, text)
        : kind === "writing"
          ? await evaluateWriting(task as WritingTask, text)
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
      return NextResponse.json({ error: "The AI examiner is busy right now. Please try again in a minute." }, { status: 503 });
    }
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "AI grading is not configured correctly on the server." }, { status: 500 });
    }
    if (err instanceof Anthropic.APIConnectionError) {
      return NextResponse.json({ error: "Couldn't reach the AI examiner. Check your connection and try again." }, { status: 503 });
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json({ error: "The AI examiner returned an error. Please try again." }, { status: 502 });
    }
    const message = err instanceof Error ? err.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
