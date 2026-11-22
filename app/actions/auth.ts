"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { isLocale } from "@/lib/i18n/config";
import { getT } from "@/lib/i18n/server";
import { writeLocaleCookie } from "./locale";

export interface AuthState {
  error?: string;
}

const registerSchema = (t: Awaited<ReturnType<typeof getT>>["t"]) =>
  z.object({
    name: z.string().trim().min(1, t("errors.nameRequired")).max(60),
    email: z.string().trim().toLowerCase().email(t("errors.emailInvalid")),
    password: z.string().min(8, t("errors.passwordShort")).max(200),
  });

export async function register(_: AuthState, form: FormData): Promise<AuthState> {
  const { t, locale } = await getT();
  const parsed = registerSchema(t).safeParse({
    name: form.get("name"),
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? t("errors.invalid") };
  const { name, email, password } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: t("errors.emailTaken") };
  const user = await prisma.user.create({ data: { name, email, passwordHash: await hashPassword(password), locale } });
  await createSession(user.id);
  redirect("/onboarding");
}

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const { t } = await getT();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
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
