import { z } from "zod";
import { parseEvaluationPayload } from "./normalize";
import { EvaluationSchema, type Evaluation } from "./schema";

export interface EvalRequest {
  kind: "writing" | "speaking" | "conversation";
  /** System instructions for the model (examiner role + feedback rules). */
  instructions: string;
  /** The task and the learner's response, ready to send as the user message. */
  input: string;
  criteria: string[];
  meta: Record<string, string | number | boolean | null>;
}

let schemaCache: unknown;
/** JSON Schema of the expected response, sent to n8n so any model can be told the exact format. */
export function evaluationJsonSchema() {
  return (schemaCache ??= z.toJSONSchema(EvaluationSchema));
}

export class WebhookError extends Error {}

/**
 * Sends an evaluation request to an n8n (or any HTTP) webhook and validates the reply.
 * Contract documented in docs/n8n.md.
 */
export async function evaluateViaWebhook(
  req: EvalRequest,
  opts: { url: string; secret?: string; timeoutMs?: number; fetchImpl?: typeof fetch },
): Promise<Evaluation> {
  const doFetch = opts.fetchImpl ?? fetch;
  let res: Response;
  try {
    res = await doFetch(opts.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(opts.secret ? { "X-BandUp-Secret": opts.secret } : {}),
      },
      body: JSON.stringify({ ...req, responseSchema: evaluationJsonSchema() }),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 90_000),
    });
  } catch (e) {
    const timeout = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    throw new WebhookError(timeout ? "The evaluation service took too long to respond. Please try again." : "Couldn't reach the evaluation service.");
  }
  if (!res.ok) throw new WebhookError(`The evaluation service returned an error (${res.status}).`);
  const raw = await res.text();
  let payload: unknown = raw;
  try {
    payload = JSON.parse(raw);
  } catch {
    // plain-text body: parseEvaluationPayload will look for JSON inside it
  }
  try {
    return parseEvaluationPayload(payload, req.criteria);
  } catch (e) {
    throw new WebhookError(e instanceof Error ? e.message : "Invalid evaluation response.");
  }
}
