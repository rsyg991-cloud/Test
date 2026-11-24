import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { stage0Items } from "@/content/stage0";
import { emojiKey, emojiParts } from "@/lib/emoji";

describe("pictures (Fluent Emoji SVGs)", () => {
  it("splits a picture into emoji and text, ignoring variation selectors", () => {
    expect(emojiParts("🐱📦").map((p) => p.kind)).toEqual(["emoji", "emoji"]);
    expect(emojiParts("10")).toEqual([{ kind: "text", text: "10" }]);
    expect(emojiKey("6️⃣")).toBe("0036-20e3");
    expect(emojiKey("☀️")).toBe("2600");
  });

  it("has a local SVG for every picture Stage 0 uses (run scripts/emoji/build.ts after adding one)", () => {
    const missing = new Set<string>();
    for (const x of stage0Items as { id: string; image?: string }[])
      for (const p of emojiParts(x.image ?? "")) if (p.kind === "emoji" && !existsSync(join(process.cwd(), "public", p.src))) missing.add(`${x.id} ${p.char}`);
    expect([...missing]).toEqual([]);
  });
});
