import type { ConversationScenario } from "@/content/types";

const LEVEL: Record<number, string> = {
  1: "B1 (intermediate). Use simple, clear everyday English, short sentences and common words. Speak a little slower than normal.",
  2: "B1+ to B2 (upper-intermediate). Use natural everyday English with some less common words, at a normal pace.",
  3: "B2 to C1 (advanced). Use natural, fluent English with academic and idiomatic language where it fits.",
  4: "C1 (proficient). Speak exactly like a fluent native speaker or a real IELTS examiner, at natural speed.",
};

/**
 * Builds the role-play prompt the learner pastes into ChatGPT (works in text or voice mode).
 * Kept deterministic so the same scenario always produces the same prompt.
 */
export function buildChatGPTPrompt(s: ConversationScenario): string {
  const phrases = s.keyPhrases.map((p) => `"${p.phrase}"`).join(", ");
  const words = s.vocab.map((v) => v.word).join(", ");
  return `Let's do an English speaking role-play to help me prepare for the IELTS exam.

ROLES
- You are ${s.aiRole}.
- I am ${s.learnerRole}.
- Situation: ${s.situation}

MY LEVEL
My English level is ${LEVEL[s.stage] ?? LEVEL[2]}

HOW TO RUN THE CONVERSATION
1. Stay in your role the whole time. Start immediately by saying: "${s.opener}"
2. Say only one thing or ask only one question at a time, then wait for my reply.
3. Keep your replies short (2–3 sentences) so I do most of the talking. If my answer is very short, ask a follow-up question that makes me say more.
4. Do NOT correct my mistakes during the conversation — just keep it natural.
5. If I say something you don't understand, ask me to clarify, like a real person would.
6. Continue for about ${s.turns} exchanges, or until I say "END".

I am practising these phrases: ${phrases}
and these words: ${words}.
My missions: ${s.missions.join("; ")}.

WHEN THE CONVERSATION ENDS
Step out of your role and give me feedback in English:
- My 3 most important mistakes, each with a corrected version.
- Which of the target phrases and words I used, and which I missed.
- Whether I completed each mission.
- One tip to sound more natural.
- An estimated IELTS Speaking band (be honest, not generous).

Please start now.`;
}

/** Instructions shown to the learner for running the conversation. */
export const CHATGPT_URL = "https://chatgpt.com/";
