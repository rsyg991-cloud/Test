import { clampBand } from "@/lib/scoring";
import { EvaluationSchema, type Evaluation } from "./schema";

/** Clamp bands, force the expected criteria names/order and trim lists. */
export function normalizeEvaluation(parsed: Evaluation, criteriaNames: string[]): Evaluation {
  const criteria = criteriaNames.map((name, i) => {
    const c = parsed.criteria[i];
    return { name, band: clampBand(c?.band), comment: c?.comment ?? "" };
  });
  return {
    ...parsed,
    overall_band: clampBand(parsed.overall_band),
    criteria,
    corrections: parsed.corrections.slice(0, 8),
    improvements: parsed.improvements.slice(0, 3),
  };
}

/** Pull a JSON object out of a model's text output (handles ```json fences and surrounding prose). */
export function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("No JSON object found in the AI response.");
    return JSON.parse(cleaned.slice(start, end + 1));
  }
}

/**
 * Accepts the shapes an n8n workflow commonly returns:
 * the Evaluation object itself, `{ output | text | response | json | data: <object or JSON string> }`,
 * or an array of items (n8n "Respond with all items").
 */
export function parseEvaluationPayload(payload: unknown, criteriaNames: string[]): Evaluation {
  let value: unknown = payload;
  for (let depth = 0; depth < 4; depth++) {
    if (Array.isArray(value)) value = value[0];
    if (typeof value === "string") value = extractJson(value);
    if (value && typeof value === "object" && !("overall_band" in value)) {
      const o = value as Record<string, unknown>;
      const inner = o.output ?? o.text ?? o.response ?? o.json ?? o.data ?? o.message ?? o.content;
      if (inner === undefined) break;
      value = inner;
      continue;
    }
    break;
  }
  const result = EvaluationSchema.safeParse(value);
  if (!result.success) {
    throw new Error("The evaluation service returned data in an unexpected format.");
  }
  return normalizeEvaluation(result.data, criteriaNames);
}
