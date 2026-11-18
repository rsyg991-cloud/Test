import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getConversation, getStage } from "@/content";
import { Icon } from "@/components/icons";
import { requireUser } from "@/lib/auth";
import { buildChatGPTPrompt } from "@/lib/conversation/prompt";
import { prisma } from "@/lib/db";
import { ConversationFlow } from "./ConversationFlow";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: getConversation(id)?.title ?? "Conversation" };
}

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const scenario = getConversation(id);
  if (!scenario) notFound();
  const user = await requireUser();

  if (scenario.stage > user.unlockedStage) {
    return (
      <div className="card mx-auto max-w-lg p-8 text-center">
        <Icon name="lock" size={36} style={{ margin: "0 auto", color: "var(--muted)" }} />
        <h1 className="mt-4 font-display text-2xl font-bold">This conversation is locked</h1>
        <p className="mt-2" style={{ color: "var(--muted)" }}>
          Pass the Stage {scenario.stage - 1} checkpoint to unlock Stage {scenario.stage} conversations.
        </p>
        <Link href="/practice#conversations" className="btn btn-primary mt-6">
          Back to conversations
        </Link>
      </div>
    );
  }

  const completedBefore = (await prisma.attempt.count({ where: { userId: user.id, kind: "conversation-complete", refId: id } })) > 0;
  return (
    <ConversationFlow
      scenario={scenario}
      stageName={getStage(scenario.stage)!.name}
      prompt={buildChatGPTPrompt(scenario)}
      completedBefore={completedBefore}
    />
  );
}
