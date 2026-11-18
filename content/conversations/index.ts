import type { ConversationScenario } from "../types";
import { stage1Conversations } from "./stage1";
import { stage2Conversations } from "./stage2";
import { stage3Conversations } from "./stage3";
import { stage4Conversations } from "./stage4";

export const conversations: ConversationScenario[] = [
  ...stage1Conversations,
  ...stage2Conversations,
  ...stage3Conversations,
  ...stage4Conversations,
];

export function getConversation(id: string): ConversationScenario | undefined {
  return conversations.find((c) => c.id === id);
}
