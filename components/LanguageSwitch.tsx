"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/app/actions/locale";
import { useT } from "@/lib/i18n/client";

/** "العربية" in English mode, "English" in Arabic mode. Remembers the choice. */
export function LanguageSwitch({ className = "" }: { className?: string }) {
  const { t, locale } = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const next = locale === "ar" ? "en" : "ar";
  return (
    <button
      type="button"
      lang={next}
      aria-label={t("lang.switchLabel")}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await setLocale(next);
          router.refresh();
        })
      }
      className={`btn btn-ghost px-3 py-2 text-sm ${next === "ar" ? "font-arabic" : ""} ${className}`}
    >
      {t("lang.switchTo")}
    </button>
  );
}
