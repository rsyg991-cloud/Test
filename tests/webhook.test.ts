import { describe, expect, it, vi } from "vitest";
import { parseEvaluationPayload } from "@/lib/ai/normalize";
import { WRITING_CRITERIA } from "@/lib/ai/schema";
import { evaluateViaWebhook, WebhookError, type EvalRequest } from "@/lib/ai/webhook";

const sample = {
  overall_band: 6.3,
  criteria: [
    { name: "TA", band: 6.5, comment: "a" },
    { name: "CC", band: 7, comment: "b" },
    { name: "LR", band: 12, comment: "c" },
    { name: "GRA", band: 6, comment: "d" },
  ],
  summary: "Good.",
  strengths: ["x"],
  improvements: ["1", "2", "3", "4"],
  corrections: [],
  upgraded_version: "Better.",
};

const req: EvalRequest = {
  kind: "writing",
  instructions: "You are an examiner.",
  input: "<response>…</response>",
  criteria: WRITING_CRITERIA,
  meta: { words: 120 },
};

const respond = (body: unknown, status = 200) =>
  vi.fn(async () => new Response(typeof body === "string" ? body : JSON.stringify(body), { status })) as unknown as typeof fetch;

describe("parseEvaluationPayload", () => {
  it("accepts the evaluation object, normalises bands and criteria names", () => {
    const e = parseEvaluationPayload(sample, WRITING_CRITERIA);
    expect(e.overall_band).toBe(6.5);
    expect(e.criteria.map((c) => c.name)).toEqual(WRITING_CRITERIA);
    expect(e.criteria[2].band).toBe(9);
    expect(e.improvements).toHaveLength(3);
  });

  it("unwraps common n8n shapes: {output: string}, fenced JSON, arrays", () => {
    expect(parseEvaluationPayload({ output: JSON.stringify(sample) }, WRITING_CRITERIA).overall_band).toBe(6.5);
    expect(parseEvaluationPayload([{ text: "Here you go:\n```json\n" + JSON.stringify(sample) + "\n```" }], WRITING_CRITERIA).summary).toBe("Good.");
    expect(parseEvaluationPayload([{ json: sample }], WRITING_CRITERIA).overall_band).toBe(6.5);
  });

  it("rejects malformed data", () => {
    expect(() => parseEvaluationPayload({ output: "sorry, I can't" }, WRITING_CRITERIA)).toThrow();
    expect(() => parseEvaluationPayload({ overall_band: 6 }, WRITING_CRITERIA)).toThrow(/unexpected format/);
  });
});

describe("evaluateViaWebhook", () => {
  it("posts the request with the secret header and JSON schema", async () => {
    const f = respond({ output: sample });
    const e = await evaluateViaWebhook(req, { url: "https://n8n.test/webhook/x", secret: "s3cret", fetchImpl: f });
    expect(e.overall_band).toBe(6.5);
    const [url, init] = (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://n8n.test/webhook/x");
    expect((init.headers as Record<string, string>)["X-BandUp-Secret"]).toBe("s3cret");
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({ kind: "writing", instructions: req.instructions, input: req.input, criteria: WRITING_CRITERIA });
    expect(body.responseSchema.properties.overall_band).toBeTruthy();
  });

  it("accepts a plain-text body containing JSON", async () => {
    const e = await evaluateViaWebhook(req, { url: "https://n8n.test", fetchImpl: respond("```json\n" + JSON.stringify(sample) + "\n```") });
    expect(e.upgraded_version).toBe("Better.");
  });

  it("turns HTTP errors and bad payloads into friendly WebhookErrors", async () => {
    await expect(evaluateViaWebhook(req, { url: "https://n8n.test", fetchImpl: respond({ error: "x" }, 500) })).rejects.toThrow(WebhookError);
    await expect(evaluateViaWebhook(req, { url: "https://n8n.test", fetchImpl: respond({ foo: 1 }) })).rejects.toThrow(WebhookError);
    const failing = vi.fn(async () => {
      throw new TypeError("network down");
    }) as unknown as typeof fetch;
    await expect(evaluateViaWebhook(req, { url: "https://n8n.test", fetchImpl: failing })).rejects.toThrow(/Couldn't reach/);
  });
});
