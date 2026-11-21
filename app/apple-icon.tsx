import { ImageResponse } from "next/og";
import { MARK_ARROW } from "@/components/logo-paths";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** The BandUp mark on its highlighter tile, for iOS home screens. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#ffe14d" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="20" fill="#111316" />
          <path d={MARK_ARROW} fill="#ffe14d" />
        </svg>
      </div>
    ),
    size,
  );
}
