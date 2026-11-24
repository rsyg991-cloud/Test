import { emojiParts } from "@/lib/emoji";

/**
 * A picture made of emoji ("🐱", "🐱📦", "6️⃣🐱"), drawn with the Fluent Emoji SVGs in public/emoji so
 * it looks the same on every device; digits and other text are kept as text. Decorative: the
 * meaning is always given in words next to it.
 */
export function Picture({ image, size = 48 }: { image: string; size?: number }) {
  const parts = emojiParts(image);
  const n = parts.filter((p) => p.kind === "emoji").length;
  // Several pictures side by side share the space of one, so a card never overflows on a phone.
  const each = n > 2 ? Math.round(size * 0.62) : n === 2 ? Math.round(size * 0.8) : size;
  return (
    <span className="inline-flex flex-wrap items-center justify-center gap-1" aria-hidden="true">
      {parts.map((p, i) =>
        p.kind === "emoji" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={p.src} alt="" width={each} height={each} draggable={false} loading="lazy" decoding="async" />
        ) : (
          <span key={i} className="num font-bold leading-none" style={{ fontSize: Math.round(size * 0.8) }}>
            {p.text}
          </span>
        ),
      )}
    </span>
  );
}
