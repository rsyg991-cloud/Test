import { LanguageSwitch } from "@/components/LanguageSwitch";
import { Logo } from "@/components/ui";
import { getT } from "@/lib/i18n/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t, rich } = await getT();
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-10">
        <div className="flex items-center justify-between gap-3">
          <Logo />
          <LanguageSwitch />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">{children}</div>
      </div>
      <div
        className="relative hidden flex-col justify-end overflow-hidden p-12 text-white lg:flex"
        style={{ background: "#0a2540" }}
      >
        <svg viewBox="0 0 240 288" className="absolute end-12 top-12 w-60" aria-hidden="true">
          {[1, 3, 0, 2, 1, 3, 2].map((a, r) =>
            [0, 1, 2, 3].map((c) => (
              <circle key={`${r}-${c}`} cx={48 + c * 48} cy={48 + r * 32} r="10" fill={c === a ? "#4cc3f5" : "none"} stroke={c === a ? "none" : "#eaf5fd"} strokeOpacity="0.5" strokeWidth="2" />
            )),
          )}
        </svg>
        <blockquote className="relative max-w-md">
          <span className="block h-1.5 w-12 rounded-full" style={{ background: "#4cc3f5" }} />
          <p className="mt-4 font-display text-3xl leading-tight">
            {rich("auth.panelQuote")}
          </p>
          <p className="mt-4 opacity-80">{t("auth.panelBody")}</p>
        </blockquote>
      </div>
    </div>
  );
}
