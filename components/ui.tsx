import Link from "next/link";
import type { Skill } from "@/content/types";
import { Icon } from "./icons";
import { LOGO_AR, LOGO_BOX, LOGO_FIRST, LOGO_SECOND, LOGO_SEP, LOGO_SWIPE, LOGO_WIDTH, MARK } from "./logo-paths";

export const SKILL_META: Record<Skill, { label: string; icon: string; color: string; soft: string }> = {
  reading: { label: "Reading", icon: "book", color: "var(--reading)", soft: "color-mix(in srgb, var(--reading) 14%, transparent)" },
  listening: { label: "Listening", icon: "headphones", color: "var(--listening)", soft: "color-mix(in srgb, var(--listening) 14%, transparent)" },
  writing: { label: "Writing", icon: "pen", color: "var(--writing)", soft: "color-mix(in srgb, var(--writing) 16%, transparent)" },
  speaking: { label: "Speaking", icon: "mic", color: "var(--speaking)", soft: "color-mix(in srgb, var(--speaking) 14%, transparent)" },
};

/** The bulbul on its highlighter tile. Its body is the filled answer bubble. */
function MarkShapes() {
  return (
    <>
      <rect width="64" height="64" rx="14" fill="var(--highlighter)" />
      <g fill="var(--on-highlighter)">
        <path d={MARK.tail} />
        <path d={MARK.crest} />
        <path d={MARK.beak} />
        <circle {...MARK.body} />
        <circle {...MARK.head} />
      </g>
      <circle {...MARK.eye} fill="var(--highlighter)" />
    </>
  );
}

export function BrandMark({ size = 32, title }: { size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <MarkShapes />
    </svg>
  );
}

/** Width of the Latin-only lockup (mark + "Balbal"), used on narrow screens. */
const LATIN_WIDTH = Math.round(LOGO_SEP.x - 4);

/**
 * The Balbal lockup: the bulbul mark, "Balbal" with the second "bal" marked by the highlighter,
 * and "بلبل". On phones only the mark and the Latin name are shown.
 */
export function Logo({ href = "/", small = false }: { href?: string; small?: boolean }) {
  const h = small ? 28 : 34;
  const art = (
    <>
      <MarkShapes />
      <rect className="logo-swipe" {...LOGO_SWIPE} fill="var(--highlighter)" />
      <rect className="logo-box" {...LOGO_BOX} rx="4" fill="var(--highlighter)" />
      <path d={LOGO_FIRST} fill="var(--ink)" />
      <path className="logo-marked" d={LOGO_SECOND} />
    </>
  );
  return (
    <Link href={href} className="inline-flex shrink-0 items-center" aria-label="Balbal home">
      <svg height={h} width={(h * LATIN_WIDTH) / 64} viewBox={`0 0 ${LATIN_WIDTH} 64`} aria-hidden="true" className="brand-logo sm:hidden">
        {art}
      </svg>
      <svg height={h} width={(h * LOGO_WIDTH) / 64} viewBox={`0 0 ${LOGO_WIDTH} 64`} aria-hidden="true" className="brand-logo hidden sm:block">
        {art}
        <rect {...LOGO_SEP} fill="var(--line)" />
        <path d={LOGO_AR} fill="var(--ink)" />
      </svg>
    </Link>
  );
}

export function SkillBadge({ skill, size = "sm" }: { skill: Skill; size?: "sm" | "md" }) {
  const m = SKILL_META[skill];
  return (
    <span className="chip" style={{ background: m.soft, color: m.color }}>
      <Icon name={m.icon} size={size === "sm" ? 13 : 16} strokeWidth={2.4} />
      {m.label}
    </span>
  );
}

export function SkillIcon({ skill, size = 44 }: { skill: Skill; size?: number }) {
  const m = SKILL_META[skill];
  return (
    <span className="grid shrink-0 place-items-center rounded-[10px]" style={{ background: m.soft, color: m.color, width: size, height: size }}>
      <Icon name={m.icon} size={size * 0.48} strokeWidth={2.2} />
    </span>
  );
}

export function ProgressBar({ value, color = "var(--brand)", height = 8, label }: { value: number; color?: string; height?: number; label?: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      className="w-full overflow-hidden rounded-full"
      style={{ background: "var(--surface-2)", height }}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function Ring({
  value,
  size = 120,
  stroke = 12,
  color = "var(--brand)",
  children,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: React.ReactNode;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, value));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-2)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function BandPill({ band, large = false }: { band: number | null; large?: boolean }) {
  return (
    <span
      className={`num inline-flex items-baseline gap-1 rounded-md font-bold ${large ? "px-4 py-1.5 text-2xl" : "px-2.5 py-0.5 text-sm"}`}
      style={{ background: "var(--surface-2)" }}
    >
      <span className="text-[0.6em] font-sans font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
        Band
      </span>
      {band === null ? "—" : band.toFixed(1)}
    </span>
  );
}

export function PageHeader({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="eyebrow mb-1">{eyebrow}</div>}
        <h1 className="font-display text-3xl sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl" style={{ color: "var(--muted)" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
