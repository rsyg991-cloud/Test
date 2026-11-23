import type { ConversationScenario } from "@/content/types";

// Keyed by stage. Stages 1–3 are the foundation stages (A0 → B1); Stages 4–7 are the IELTS stages.
const LEVEL: Record<number, string> = {
  1: "A1 (beginner). Use very simple, short sentences and the most common words. Speak slowly and repeat if I don't understand.",
  2: "A2 (elementary). Use simple everyday English and short sentences. Speak slowly and clearly.",
  3: "A2 to B1 (pre-intermediate). Use simple, clear English and common words. Speak a little slower than normal.",
  4: "B1 (intermediate). Use simple, clear everyday English, short sentences and common words. Speak a little slower than normal.",
  5: "B1+ to B2 (upper-intermediate). Use natural everyday English with some less common words, at a normal pace.",
  6: "B2 to C1 (advanced). Use natural, fluent English with academic and idiomatic language where it fits.",
  7: "C1 (proficient). Speak exactly like a fluent native speaker or a real IELTS examiner, at natural speed.",
};

/**
 * Builds the role-play prompt the learner pastes into ChatGPT (works in text or voice mode).
 * Kept deterministic so the same scenario always produces the same prompt.
 */
export function buildChatGPTPrompt(s: ConversationScenario): string {
  const phrases = s.keyPhrases.map((p) => `"${p.phrase}"`).join(", ");
  const words = s.vocab.map((v) => v.word).join(", ");
  const foundation = s.stage <= 3;
  const goal = foundation ? "to help me practise speaking English in everyday situations" : "to help me prepare for the IELTS exam";
  const stuck = foundation
    ? "\n7. I am a beginner. If I get stuck, I may write a word in Arabic: tell me the English word, then continue in English."
    : "";
  const ending = foundation
    ? `- My 3 most important mistakes, each with a corrected version and a short explanation in Arabic.
- Which of the target phrases and words I used, and which I missed.
- Whether I completed each mission.
- One thing I did well, and one tip for next time.`
    : `- My 3 most important mistakes, each with a corrected version.
- Which of the target phrases and words I used, and which I missed.
- Whether I completed each mission.
- One tip to sound more natural.
- An estimated IELTS Speaking band (be honest, not generous).`;
  return `Let's do an English speaking role-play ${goal}.

ROLES
- You are ${s.aiRole}.
- I am ${s.learnerRole}.
- Situation: ${s.situation}

MY LEVEL
My English level is ${LEVEL[s.stage] ?? LEVEL[5]}

HOW TO RUN THE CONVERSATION
1. Stay in your role the whole time. Start immediately by saying: "${s.opener}"
2. Say only one thing or ask only one question at a time, then wait for my reply.
3. Keep your replies short (2–3 sentences) so I do most of the talking. If my answer is very short, ask a follow-up question that makes me say more.
4. Do NOT correct my mistakes during the conversation — just keep it natural.
5. If I say something you don't understand, ask me to clarify, like a real person would.
6. Continue for about ${s.turns} exchanges, or until I say "END".${stuck}

I am practising these phrases: ${phrases}
and these words: ${words}.
My missions: ${s.missions.join("; ")}.

WHEN THE CONVERSATION ENDS
Step out of your role and give me feedback in English:
${ending}

Please start now.`;
}

/** Instructions shown to the learner for running the conversation. */
export const CHATGPT_URL = "https://chatgpt.com/";
