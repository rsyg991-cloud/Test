import Link from "next/link";
import { Icon } from "./icons";

export interface StageProgress {
  id: number;
  name: string;
  camp: string;
  cefr: string;
  pct: number; // 0..1 lessons completed in the stage
  passed: boolean;
  locked: boolean;
}

// Camp positions on the trail (in % of the map), and their fraction along the trail path.
const CAMPS = [
  { x: 22, y: 82, along: 0.17 },
  { x: 72, y: 60, along: 0.44 },
  { x: 28, y: 38, along: 0.7 },
  { x: 55, y: 9, along: 1 },
];
const TRAIL = "M60 492 C 30 450, 60 420, 88 410 S 300 350, 288 300 S 250 220, 112 190 S 90 110, 220 45";

export function JourneyMap({ stages, compact = false }: { stages: StageProgress[]; compact?: boolean }) {
  // Overall position: passed stages count fully, the current stage by its lesson completion.
  let v = 0;
  for (const s of stages) {
    if (s.passed) v += 1;
    else {
      v += s.locked ? 0 : Math.min(0.95, s.pct);
      break;
    }
  }
  const anchors = [0, ...CAMPS.map((c) => c.along)];
  const k = Math.min(3, Math.floor(v));
  const along = v >= 4 ? 1 : anchors[k] + (v - k) * (anchors[k + 1] - anchors[k]);
  const currentIdx = stages.findIndex((s) => !s.passed && !s.locked);

  return (
    <div
      className="relative w-full overflow-hidden rounded-3xl"
      style={{
        aspectRatio: compact ? "4 / 4.2" : "4 / 5",
        background: "linear-gradient(180deg, color-mix(in srgb, var(--listening) 18%, var(--surface)) 0%, var(--surface) 70%)",
      }}
    >
      <svg viewBox="0 0 400 500" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="mtn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--navy)" stopOpacity="0.85" />
            <stop offset="1" stopColor="var(--navy)" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="trail" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="var(--brand)" />
            <stop offset="1" stopColor="var(--gold)" />
          </linearGradient>
        </defs>
        <circle cx="330" cy="70" r="34" fill="var(--gold)" opacity="0.35" />
        <polygon points="-20,500 90,300 140,340 220,40 300,210 340,180 430,500" fill="url(#mtn)" opacity="0.18" />
        <polygon points="-20,500 60,380 120,420 200,260 280,360 330,300 430,500" fill="var(--navy)" opacity="0.1" />
        <polygon points="220,40 246,92 232,86 220,100 206,88 194,96" fill="var(--surface)" opacity="0.9" />
        <path d={TRAIL} fill="none" stroke="var(--line)" strokeWidth="6" strokeDasharray="2 10" strokeLinecap="round" />
        <path
          d={TRAIL}
          fill="none"
          stroke="url(#trail)"
          strokeWidth="7"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - along}
        />
      </svg>

      {stages.map((s, i) => {
        const c = CAMPS[i];
        const isCurrent = i === currentIdx;
        const bg = s.passed ? "var(--success)" : isCurrent ? "var(--brand)" : s.locked ? "var(--surface-2)" : "var(--surface)";
        const fg = s.passed || isCurrent ? "#fff" : "var(--muted)";
        return (
          <Link
            key={s.id}
            href={`/journey#stage-${s.id}`}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${c.x}%`, top: `${c.y}%` }}
            aria-label={`${s.camp}: Stage ${s.id}, ${s.name}${s.passed ? " (completed)" : s.locked ? " (locked)" : ""}`}
          >
            <span
              className={`grid place-items-center rounded-full border-4 ${isCurrent ? "animate-pulse-ring" : ""}`}
              style={{ width: compact ? 40 : 48, height: compact ? 40 : 48, background: bg, color: fg, borderColor: "var(--surface)" }}
            >
              {s.passed ? <Icon name="check" size={20} strokeWidth={3} /> : s.locked ? <Icon name="lock" size={17} /> : i === 3 ? <Icon name="trophy" size={19} /> : <span className="font-display text-lg font-bold">{s.id}</span>}
            </span>
            <span
              className="absolute top-1/2 w-max max-w-[9.5rem] -translate-y-1/2 rounded-xl px-2.5 py-1 shadow-sm"
              style={{ background: "var(--surface)", ...(c.x > 50 ? { right: "calc(100% + 8px)", textAlign: "right" } : { left: "calc(100% + 8px)" }) }}
            >
              <span className="block text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                {s.camp}
              </span>
              <span className="block text-sm font-bold leading-tight">{s.name}</span>
              {!compact && (
                <span className="block text-[11px] font-semibold" style={{ color: "var(--muted)" }}>
                  {s.cefr} · {Math.round(s.pct * 100)}%
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
