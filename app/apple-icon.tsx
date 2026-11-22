import { ImageResponse } from "next/og";
import { MARK } from "@/components/logo-paths";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const SKY = "#4cc3f5";
const NAVY = "#0a2540";

/** The singing bulbul on its sky tile, for iOS home screens. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: SKY }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <path d={MARK.bird} fill={NAVY} />
          <path d={MARK.beak} fill={NAVY} />
          <path d={MARK.wing} fill="none" stroke={SKY} strokeWidth="2.4" strokeLinecap="round" />
          <circle cx={MARK.eye.cx} cy={MARK.eye.cy} r={MARK.eye.r} fill={SKY} />
          <path d={MARK.waves} fill="none" stroke={NAVY} strokeWidth="2.8" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size,
  );
}
