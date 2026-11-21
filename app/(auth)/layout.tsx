import { Logo } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
      </div>
      <div
        className="relative hidden flex-col justify-end overflow-hidden p-12 text-white lg:flex"
        style={{ background: "#111316" }}
      >
        <svg viewBox="0 0 240 288" className="absolute right-12 top-12 w-60" aria-hidden="true">
          {[1, 3, 0, 2, 1, 3, 2].map((a, r) =>
            [0, 1, 2, 3].map((c) => (
              <circle key={`${r}-${c}`} cx={48 + c * 48} cy={48 + r * 32} r="10" fill={c === a ? "#ffe14d" : "none"} stroke={c === a ? "none" : "#f7f7f5"} strokeOpacity="0.5" strokeWidth="2" />
            )),
          )}
        </svg>
        <blockquote className="relative max-w-md">
          <span className="block h-1.5 w-12 rounded-full" style={{ background: "#ffe14d" }} />
          <p className="mt-4 font-display text-3xl leading-tight">
            Small steps every day beat <span style={{ color: "#ffe14d" }}>big plans</span> once a month.
          </p>
          <p className="mt-4 opacity-80">Start from any level, even zero. Twenty focused minutes a day is enough to move your band, and we show you exactly what to do with them.</p>
        </blockquote>
      </div>
    </div>
  );
}
