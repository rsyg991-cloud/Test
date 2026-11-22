"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { LOGO_AR, LOGO_BOX, LOGO_FIRST, LOGO_SECOND, LOGO_SEP, LOGO_SWIPE, LOGO_WIDTH, MARK } from "./logo-paths";

/** The singing bulbul on its sky tile: navy bird, eye and wing cut in the tile colour. */
function MarkShapes() {
  return (
    <>
      <rect width="64" height="64" rx="14" fill="var(--tile)" />
      <path d={MARK.bird} fill="var(--on-tile)" />
      <path d={MARK.beak} fill="var(--on-tile)" />
      <path d={MARK.wing} fill="none" stroke="var(--tile)" strokeWidth="2.4" strokeLinecap="round" />
      <circle {...MARK.eye} fill="var(--tile)" />
      <path d={MARK.waves} fill="none" stroke="var(--on-tile)" strokeWidth="2.8" strokeLinecap="round" />
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
  const { t } = useT();
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
    <Link href={href} className="inline-flex shrink-0 items-center" aria-label={t("nav.home")}>
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

