"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";

export interface AuthState {
  error?: string;
}

const RegisterSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(60),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
});

export async function register(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = RegisterSchema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid details." };
  const { name, email, password } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "An account with this email already exists. Try logging in." };
  const user = await prisma.user.create({ data: { name, email, passwordHash: await hashPassword(password) } });
  await createSession(user.id);
  redirect("/onboarding");
}

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Email or password is incorrect." };
  }
  await createSession(user.id);
  redirect(user.placementDone && user.planMonths ? "/dashboard" : "/onboarding");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
