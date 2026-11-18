"use client";

import { questionAnchor } from "./QuestionGroupView";

/** Bottom bar with buttons 1–40: answered, flagged and current state, like the computer-delivered test. */
export function QuestionNavigator({
  section,
  numbers,
  answered,
  flagged,
  onSelect,
}: {
  section: string;
  numbers: number[];
  answered: Set<number>;
  flagged: Set<number>;
  onSelect?: (n: number) => void;
}) {
  return (
    <nav aria-label="Question navigator" className="flex flex-wrap gap-1">
      {numbers.map((n) => {
        const a = answered.has(n);
        const f = flagged.has(n);
        return (
          <button
            key={n}
            type="button"
            onClick={() => {
              onSelect?.(n);
              requestAnimationFrame(() => document.getElementById(questionAnchor(section, n))?.scrollIntoView({ behavior: "smooth", block: "center" }));
            }}
            className="h-7 w-7 rounded-md text-xs font-bold"
            style={{
              background: a ? "var(--ink)" : "var(--surface-2)",
              color: a ? "var(--bg)" : "var(--ink)",
              outline: f ? "2px solid var(--writing)" : undefined,
              outlineOffset: 1,
            }}
            aria-label={`Go to question ${n}${a ? " (answered)" : ""}${f ? " (flagged)" : ""}`}
          >
            {n}
          </button>
        );
      })}
    </nav>
  );
}
