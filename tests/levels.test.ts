import { describe, expect, it } from "vitest";
import { showsLevels } from "@/content/goals";
import { cefrForBand, nextCefr } from "@/lib/scoring";

describe("level display for General English learners", () => {
  it("shows levels only to learners whose goals leave out IELTS", () => {
    expect(showsLevels(null)).toBe(false); // legacy learners keep their band view
    expect(showsLevels(JSON.stringify(["general", "ielts"]))).toBe(false);
    expect(showsLevels(JSON.stringify(["general"]))).toBe(true);
    expect(showsLevels(JSON.stringify(["general", "work", "academic"]))).toBe(true);
  });

  it("names the next CEFR level from the same thresholds as cefrForBand", () => {
    expect(nextCefr(null)).toBeNull();
    expect(nextCefr(1)).toBe("A1");
    expect(nextCefr(3.5)).toBe("B1");
    expect(nextCefr(5.5)).toBe("C1");
    expect(nextCefr(8.5)).toBeNull();
    for (const b of [1, 2, 2.5, 3, 4, 5, 5.5, 6.5, 7, 7.5]) expect(nextCefr(b)).not.toBe(cefrForBand(b));
  });
});
