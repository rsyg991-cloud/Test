import { ImageResponse } from "next/og";
import { LOGO_AR, LOGO_FIRST, LOGO_SECOND, LOGO_SEP, LOGO_SWIPE, LOGO_WIDTH, MARK } from "@/components/logo-paths";

export const alt = "Balbal: from your first words to the IELTS band you need";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ANSWERS = [1, 3, 0, 2, 1, 3, 2];

/** Share card in the Sky palette: the lockup, the promise and an answer-bubble sheet. */
const SKY = "#4cc3f5";
const NAVY = "#0a2540";
export default function OpengraphImage() {
  const h = 104;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#ffffff" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px 0 72px 72px", width: 700 }}>
          <svg width={(h * LOGO_WIDTH) / 64} height={h} viewBox={`0 0 ${LOGO_WIDTH} 64`}>
            <rect width="64" height="64" rx="14" fill={SKY} />
            <path d={MARK.bird} fill={NAVY} />
            <path d={MARK.beak} fill={NAVY} />
            <path d={MARK.wing} fill="none" stroke={SKY} strokeWidth="2.4" strokeLinecap="round" />
            <circle cx={MARK.eye.cx} cy={MARK.eye.cy} r={MARK.eye.r} fill={SKY} />
            <path d={MARK.waves} fill="none" stroke={NAVY} strokeWidth="2.8" strokeLinecap="round" />
            <rect x={LOGO_SWIPE.x} y={LOGO_SWIPE.y} width={LOGO_SWIPE.width} height={LOGO_SWIPE.height} fill="#bfe8fb" />
            <path d={LOGO_FIRST} fill={NAVY} />
            <path d={LOGO_SECOND} fill={NAVY} />
            <rect x={LOGO_SEP.x} y={LOGO_SEP.y} width={LOGO_SEP.width} height={LOGO_SEP.height} fill="#d2e7f5" />
            <path d={LOGO_AR} fill={NAVY} />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 64, fontWeight: 800, color: NAVY, lineHeight: 1.05, letterSpacing: -2 }}>From your first words to the band you need.</div>
            <div style={{ fontSize: 26, color: "#48627a", marginTop: 24 }}>IELTS from any level · 7 stages · 4 skills</div>
          </div>
        </div>
        <div style={{ display: "flex", flex: 1, background: NAVY, alignItems: "center", justifyContent: "center" }}>
          <svg width="300" height="420" viewBox="0 0 240 336">
            {ANSWERS.map((a, r) =>
              [0, 1, 2, 3].map((c) => (
                <circle
                  key={`${r}-${c}`}
                  cx={30 + c * 60}
                  cy={24 + r * 48}
                  r="14"
                  fill={c === a ? SKY : "none"}
                  stroke={c === a ? "none" : "#eaf5fd"}
                  strokeWidth="3"
                />
              )),
            )}
          </svg>
        </div>
      </div>
    ),
    size,
  );
}
