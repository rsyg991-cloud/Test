"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icons";

const LINKS = [
  { href: "/dashboard", label: "Today", icon: "home" },
  { href: "/journey", label: "Journey", icon: "map" },
  { href: "/practice", label: "Practice", icon: "bolt" },
  { href: "/vocab", label: "Vocab", icon: "cards" },
  { href: "/progress", label: "Progress", icon: "chart" },
  { href: "/plan", label: "Plan", icon: "calendar" },
];

export function SideNav({ vocabDue }: { vocabDue: number }) {
  const path = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {LINKS.map((l) => {
        const active = path === l.href || (l.href !== "/dashboard" && path.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold transition-colors"
            style={{
              background: active ? "var(--brand-soft)" : "transparent",
              color: active ? "var(--brand)" : "var(--muted)",
            }}
          >
            <Icon name={l.icon} size={20} />
            <span className="flex-1">{l.label}</span>
            {l.href === "/vocab" && vocabDue > 0 && (
              <span className="chip" style={{ background: "var(--brand)", color: "#fff" }}>
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
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t lg:hidden"
      style={{ background: "var(--surface)", borderColor: "var(--line)", paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Main"
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
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
