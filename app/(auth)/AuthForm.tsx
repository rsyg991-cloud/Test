"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, type AuthState } from "@/app/actions/auth";
import { useT } from "@/lib/i18n/client";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { t } = useT();
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? login : register, {});
  return (
    <form action={action} className="space-y-4">
      {mode === "register" && (
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-bold">
            {t("auth.firstName")}
          </label>
          <input id="name" name="name" required autoComplete="given-name" className="input" placeholder={t("auth.namePlaceholder")} />
        </div>
      )}
      {mode === "register" ? (
        <>
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-bold">
              {t("auth.phone")}
            </label>
            <div className="flex" dir="ltr">
              <span className="input num flex w-auto shrink-0 items-center rounded-e-none border-e-0 px-3" style={{ color: "var(--muted)" }} aria-hidden="true">
                +966
              </span>
              <input id="phone" name="phone" type="tel" inputMode="tel" required autoComplete="tel-national" className="input min-w-0 flex-1 rounded-s-none" placeholder="05XXXXXXXX" />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-bold">
              {t("auth.emailOptional")}
            </label>
            <input id="email" name="email" type="email" autoComplete="email" className="input" placeholder="you@example.com" dir="ltr" />
          </div>
        </>
      ) : (
        <div>
          <label htmlFor="identifier" className="mb-1.5 block text-sm font-bold">
            {t("auth.phone")}
          </label>
          <input id="identifier" name="identifier" type="text" inputMode="tel" required autoComplete="username" className="input" placeholder="05XXXXXXXX" dir="ltr" aria-describedby="identifier-hint" />
          <p id="identifier-hint" className="mt-1.5 text-xs" style={{ color: "var(--muted)" }}>
            {t("auth.loginEmailHint")}
          </p>
        </div>
      )}
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-bold">
          {t("auth.password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={mode === "register" ? 8 : undefined}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          className="input"
          placeholder={mode === "register" ? t("auth.passwordHint") : ""}
        />
      </div>
      {state.error && (
        <p role="alert" className="rounded-md p-3 text-sm font-semibold" style={{ background: "color-mix(in srgb, var(--danger) 10%, transparent)", color: "var(--danger)" }}>
          {state.error}
        </p>
      )}
      <button className="btn btn-primary w-full py-3" disabled={pending}>
        {pending ? t("common.pleaseWait") : mode === "login" ? t("auth.login") : t("auth.register")}
      </button>
      <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
        {mode === "login" ? (
          <>
            {t("auth.newHere")}{" "}
            <Link href="/register" className="font-bold underline" style={{ color: "var(--brand)" }}>
              {t("auth.createAccount")}
            </Link>
          </>
        ) : (
          <>
            {t("auth.haveAccount")}{" "}
            <Link href="/login" className="font-bold underline" style={{ color: "var(--brand)" }}>
              {t("auth.login")}
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
