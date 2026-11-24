/**
 * Pictures for Stage 0 (and anywhere an emoji stands in for an image) are drawn from Microsoft's
 * Fluent Emoji (flat style, MIT licence), stored as local SVG files by scripts/emoji/build.ts, so they
 * look the same on every phone and computer instead of each system's own emoji font.
 *
 * Shared by the browser and the build script: keep it free of imports.
 */

/** Is this one character (grapheme) an emoji, as opposed to plain text such as a digit? */
export const isEmoji = (g: string) => /\p{Extended_Pictographic}|⃣/u.test(g);

/** The file key of an emoji: its code points in hex, without variation selectors, at least 4 digits each. */
export function emojiKey(g: string): string {
  return [...g]
    .map((c) => c.codePointAt(0)!)
    .filter((cp) => cp !== 0xfe0f)
    .map((cp) => cp.toString(16).padStart(4, "0"))
    .join("-");
}

export const emojiSrc = (g: string) => `/emoji/${emojiKey(g)}.svg`;

/** Splits an image string ("🐱📦", "10") into its characters: emoji become pictures, the rest stays text. */
export function emojiParts(s: string): ({ kind: "emoji"; src: string; char: string } | { kind: "text"; text: string })[] {
  const graphemes =
    typeof Intl !== "undefined" && "Segmenter" in Intl
      ? [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(s)].map((x) => x.segment)
      : [...s];
  const out: ({ kind: "emoji"; src: string; char: string } | { kind: "text"; text: string })[] = [];
  for (const g of graphemes) {
    if (isEmoji(g)) out.push({ kind: "emoji", src: emojiSrc(g), char: g });
    else {
      const last = out[out.length - 1];
      if (last?.kind === "text") last.text += g;
      else out.push({ kind: "text", text: g });
    }
  }
  return out;
}
