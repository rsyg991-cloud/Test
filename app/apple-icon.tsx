import { ImageResponse } from "next/og";
import { MARK } from "@/components/logo-paths";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** The Balbal bulbul on its highlighter tile, for iOS home screens. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#ffe14d" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <path d={MARK.tail} fill="#111316" />
          <path d={MARK.crest} fill="#111316" />
          <path d={MARK.beak} fill="#111316" />
          <circle cx={MARK.body.cx} cy={MARK.body.cy} r={MARK.body.r} fill="#111316" />
          <circle cx={MARK.head.cx} cy={MARK.head.cy} r={MARK.head.r} fill="#111316" />
          <circle cx={MARK.eye.cx} cy={MARK.eye.cy} r={MARK.eye.r} fill="#ffe14d" />
        </svg>
      </div>
    ),
    size,
  );
}
