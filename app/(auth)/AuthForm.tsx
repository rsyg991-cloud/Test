"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { login, register, type AuthState } from "@/app/actions/auth";
import type { CountryOption } from "@/lib/countries";
import { useT } from "@/lib/i18n/client";

/**
 * A mobile number with its country. The country picker is a native select (keyboard, screen readers and
 * the phone's own picker all work) laid invisibly over a compact flag + calling code.
 */
function PhoneField(props: { id: string; name: string; countries: CountryOption[]; autoComplete: string; describedBy?: string; acceptsEmail?: boolean }) {
  const { t } = useT();
  const [code, setCode] = useState(props.countries[0]?.code ?? "SA");
  const current = props.countries.find((c) => c.code === code) ?? props.countries[0];
  const placeholder = code === "SA" ? "05XXXXXXXX" : t("auth.phonePlaceholder");
  return (
    <div className="flex" dir="ltr">
      <div className="input relative flex w-auto shrink-0 items-center gap-1.5 rounded-e-none border-e-0 px-3 focus-within:border-[var(--brand)]">
        <span aria-hidden="true">{current?.flag}</span>
        <span className="num" style={{ color: "var(--muted)" }} aria-hidden="true">
          +{current?.dial}
        </span>
        <span aria-hidden="true" style={{ color: "var(--muted)" }}>
          ▾
        </span>
        <select
          name="country"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          aria-label={t("auth.country")}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          {props.countries.map((c) => (
            <option key={c.code} value={c.code}>
              {`${c.flag} ${c.name} (+${c.dial})`}
            </option>
          ))}
        </select>
      </div>
      <input
        id={props.id}
        name={props.name}
        type={props.acceptsEmail ? "text" : "tel"}
        inputMode="tel"
        required
        autoComplete={props.autoComplete}
        className="input min-w-0 flex-1 rounded-s-none"
        placeholder={placeholder}
        aria-describedby={props.describedBy}
      />
    </div>
  );
}

export function AuthForm({ mode, countries }: { mode: "login" | "register"; countries: CountryOption[] }) {
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
            <PhoneField id="phone" name="phone" countries={countries} autoComplete="tel-national" />
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
          <PhoneField id="identifier" name="identifier" countries={countries} autoComplete="username" describedBy="identifier-hint" acceptsEmail />
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
