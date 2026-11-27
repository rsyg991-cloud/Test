"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { isLocale } from "@/lib/i18n/config";
import { isCountry } from "@/lib/countries";
import { DEFAULT_COUNTRY, normalizePhone } from "@/lib/phone";
import { getT } from "@/lib/i18n/server";
import { writeLocaleCookie } from "./locale";

export interface AuthState {
  error?: string;
}

/** The country picked next to the number; anything unknown falls back to Saudi Arabia. */
const countryOf = (form: FormData) => {
  const c = form.get("country");
  return isCountry(c) ? c : DEFAULT_COUNTRY;
};

const registerSchema = (t: Awaited<ReturnType<typeof getT>>["t"], country: string) =>
  z.object({
    name: z.string().trim().min(1, t("errors.nameRequired")).max(60),
    phone: z
      .string()
      .transform((v, ctx) => {
        const phone = normalizePhone(v, country);
        if (!phone) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: t("errors.phoneInvalid") });
          return z.NEVER;
        }
        return phone;
      }),
    // Optional: an empty field means no email.
    email: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().trim().toLowerCase().email(t("errors.emailInvalid")).optional(),
    ),
    password: z.string().min(8, t("errors.passwordShort")).max(200),
  });

export async function register(_: AuthState, form: FormData): Promise<AuthState> {
  const { t, locale } = await getT();
  const parsed = registerSchema(t, countryOf(form)).safeParse({
    name: form.get("name"),
    phone: form.get("phone") ?? "",
    email: form.get("email") ?? undefined,
    password: form.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? t("errors.invalid") };
  const { name, phone, email, password } = parsed.data;
  if (await prisma.user.findUnique({ where: { phone } })) return { error: t("errors.phoneTaken") };
  if (email && (await prisma.user.findUnique({ where: { email } }))) return { error: t("errors.emailTaken") };
  const user = await prisma.user.create({ data: { name, phone, email, passwordHash: await hashPassword(password), locale } });
  await createSession(user.id);
  redirect("/onboarding");
}

/** Log in with the mobile number; accounts made with an email before can still use it. */
export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const { t } = await getT();
  const identifier = String(form.get("identifier") ?? "").trim();
  const password = String(form.get("password") ?? "");
  let user = null;
  if (identifier.includes("@")) {
    user = await prisma.user.findUnique({ where: { email: identifier.toLowerCase() } });
  } else {
    const phone = normalizePhone(identifier, countryOf(form));
    if (phone) user = await prisma.user.findUnique({ where: { phone } });
  }
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: t("errors.badLogin") };
  }
  await createSession(user.id);
  // Bring back the learner's saved interface language on any device.
  if (isLocale(user.locale)) await writeLocaleCookie(user.locale);
  redirect(user.placementDone && user.planMonths ? "/dashboard" : "/onboarding");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
