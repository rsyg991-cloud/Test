import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { isLocale, LOCALE_COOKIE, localeFromAcceptLanguage, type Locale } from "./config";
import { createTranslator, type Messages } from "./core";
import { ar } from "./messages/ar";
import { en } from "./messages/en";

export const MESSAGES: Record<Locale, Messages> = { en, ar };

/** The interface language: the learner's saved choice (cookie), else the browser's preference, else English. */
export const getLocale = cache(async (): Promise<Locale> => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(saved)) return saved;
  return localeFromAcceptLanguage((await headers()).get("accept-language"));
});

export const getT = cache(async () => {
  const locale = await getLocale();
  return createTranslator(locale, MESSAGES[locale]);
});
