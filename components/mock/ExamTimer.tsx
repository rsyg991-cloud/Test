"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "../icons";

/** Countdown to an absolute end time; calls onExpire once. Survives reloads because the end time is stored. */
export function ExamTimer({ endsAt, onExpire, label }: { endsAt: number; onExpire: () => void; label: string }) {
  const [now, setNow] = useState(() => Date.now());
  const fired = useRef(false);
  useEffect(() => {
    fired.current = false;
  }, [endsAt]);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, endsAt - now);
  useEffect(() => {
    if (left === 0 && !fired.current) {
      fired.current = true;
      onExpire();
    }
  }, [left, onExpire]);
  const sec = Math.ceil(left / 1000);
  const warn = sec <= 300;
  const mm = Math.floor(sec / 60);
  const ss = String(sec % 60).padStart(2, "0");
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold tabular-nums"
      style={{ background: warn ? "color-mix(in srgb, var(--danger) 14%, transparent)" : "var(--surface-2)", color: warn ? "var(--danger)" : "var(--ink)" }}
      role="timer"
      aria-label={`${label}: ${mm} minutes ${ss} seconds left`}
    >
      <Icon name="calendar" size={15} /> {mm}:{ss} <span className="font-semibold" style={{ color: "var(--muted)" }}>{label}</span>
    </div>
  );
}
