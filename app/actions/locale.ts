"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";

const YEAR = 365 * 86_400_000;

export async function writeLocaleCookie(locale: Locale) {
  (await cookies()).set(LOCALE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + YEAR),
  });
}

/** Switch the interface language; remembered in a cookie and on the learner's account. */
export async function setLocale(locale: string) {
  if (!isLocale(locale)) return;
  await writeLocaleCookie(locale);
  const user = await getCurrentUser();
  if (user && user.locale !== locale) await prisma.user.update({ where: { id: user.id }, data: { locale } });
  revalidatePath("/", "layout");
}
