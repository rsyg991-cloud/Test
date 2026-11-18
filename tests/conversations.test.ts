import { describe, expect, it } from "vitest";
import { conversations, getConversation } from "@/content";
import { buildChatGPTPrompt } from "@/lib/conversation/prompt";

describe("conversation content", () => {
  it("has 5 scenarios per stage with unique ids", () => {
    expect(conversations).toHaveLength(20);
    for (const stage of [1, 2, 3, 4]) expect(conversations.filter((c) => c.stage === stage)).toHaveLength(5);
    expect(new Set(conversations.map((c) => c.id)).size).toBe(20);
  });

  it.each(conversations.map((c) => [c.id, c] as const))("%s has complete learning material", (_, c) => {
    expect(c.keyPhrases.length).toBeGreaterThanOrEqual(5);
    expect(c.vocab.length).toBeGreaterThanOrEqual(4);
    expect(c.grammar.examples.length).toBeGreaterThanOrEqual(2);
    expect(c.modelDialogue.script.length).toBeGreaterThanOrEqual(1);
    expect(c.quickCheck).toHaveLength(3);
    for (const q of c.quickCheck) if (q.type === "mcq") expect(q.answer).toBeLessThan(q.options.length);
    expect(c.missions.length).toBeGreaterThanOrEqual(3);
    expect(c.selfCheck.length).toBeGreaterThanOrEqual(3);
    expect(c.turns).toBeGreaterThan(0);
    expect(c.opener.length).toBeGreaterThan(10);
  });
});

describe("buildChatGPTPrompt", () => {
  const c = getConversation("c1-meet-classmate")!;
  const p = buildChatGPTPrompt(c);

  it("sets up the role-play with role, opener and level", () => {
    expect(p).toContain(c.aiRole);
    expect(p).toContain(c.learnerRole);
    expect(p).toContain(c.opener);
    expect(p).toContain("B1");
  });

  it("lists the target phrases, words, missions and turn count", () => {
    for (const k of c.keyPhrases) expect(p).toContain(k.phrase);
    for (const v of c.vocab) expect(p).toContain(v.word);
    for (const m of c.missions) expect(p).toContain(m);
    expect(p).toContain(`about ${c.turns} exchanges`);
  });

  it("asks for end-of-conversation feedback and an END keyword, with no mid-conversation correction", () => {
    expect(p).toContain('"END"');
    expect(p).toMatch(/Do NOT correct my mistakes during the conversation/);
    expect(p).toMatch(/IELTS Speaking band/);
  });

  it("adapts the language level by stage", () => {
    expect(buildChatGPTPrompt(getConversation("c4-c1-discussion")!)).toContain("C1 (proficient)");
  });
});
