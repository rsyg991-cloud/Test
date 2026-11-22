"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { Icon } from "./icons";

const LINKS = [
  { href: "/dashboard", label: "nav.today", icon: "home" },
  { href: "/journey", label: "nav.journey", icon: "map" },
  { href: "/practice", label: "nav.practice", icon: "bolt" },
  { href: "/vocab", label: "nav.vocab", icon: "cards" },
  { href: "/progress", label: "nav.progress", icon: "chart" },
  { href: "/plan", label: "nav.plan", icon: "calendar" },
] as const;

const SIDE_LINKS = [...LINKS, { href: "/resources", label: "nav.resources", icon: "shield" }] as const;

export function SideNav({ vocabDue }: { vocabDue: number }) {
  const path = usePathname();
  const { t } = useT();
  return (
    <nav className="flex flex-col gap-1" aria-label={t("nav.main")}>
      {SIDE_LINKS.map((l) => {
        const active = path === l.href || (l.href !== "/dashboard" && path.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className="flex items-center gap-3 rounded-md px-3 py-2.5 font-semibold transition-colors"
            style={{
              background: active ? "var(--brand-soft)" : "transparent",
              color: active ? "var(--brand)" : "var(--muted)",
            }}
          >
            <Icon name={l.icon} size={20} />
            <span className="flex-1">{t(l.label)}</span>
            {l.href === "/vocab" && vocabDue > 0 && (
              <span className="chip" style={{ background: "var(--brand)", color: "var(--brand-ink)" }}>
                {vocabDue}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const path = usePathname();
  const { t } = useT();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t lg:hidden"
      style={{ background: "var(--surface)", borderColor: "var(--line)", paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label={t("nav.main")}
    >
      {LINKS.map((l) => {
        const active = path === l.href || (l.href !== "/dashboard" && path.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold"
            style={{ color: active ? "var(--brand)" : "var(--muted)" }}
          >
            <Icon name={l.icon} size={21} />
            {t(l.label)}
          </Link>
        );
      })}
    </nav>
  );
}
