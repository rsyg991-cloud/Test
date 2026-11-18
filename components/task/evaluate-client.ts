"use client";

import type { Evaluation } from "@/lib/ai/schema";

export type EvalSource = "lesson" | "checkpoint" | "practice" | "placement" | "conversation";

export async function requestEvaluation(body: {
  kind: "writing" | "speaking" | "conversation";
  source: EvalSource;
  refId: string;
  text: string;
  durationSec?: number;
}): Promise<{ attemptId: string; evaluation: Evaluation }> {
  const res = await fetch("/api/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Evaluation failed. Please try again.");
  return data;
}
