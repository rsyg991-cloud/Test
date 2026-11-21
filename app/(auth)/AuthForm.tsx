"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, register, type AuthState } from "@/app/actions/auth";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? login : register, {});
  return (
    <form action={action} className="space-y-4">
      {mode === "register" && (
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-bold">
            First name
          </label>
          <input id="name" name="name" required autoComplete="given-name" className="input" placeholder="e.g. Sara" />
        </div>
      )}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-bold">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" placeholder="you@example.com" />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-bold">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={mode === "register" ? 8 : undefined}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          className="input"
          placeholder={mode === "register" ? "At least 8 characters" : ""}
        />
      </div>
      {state.error && (
        <p role="alert" className="rounded-md p-3 text-sm font-semibold" style={{ background: "color-mix(in srgb, var(--danger) 10%, transparent)", color: "var(--danger)" }}>
          {state.error}
        </p>
      )}
      <button className="btn btn-primary w-full py-3" disabled={pending}>
        {pending ? "Please wait…" : mode === "login" ? "Log in" : "Create my account"}
      </button>
      <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
        {mode === "login" ? (
          <>
            New to Balbal?{" "}
            <Link href="/register" className="font-bold underline" style={{ color: "var(--brand)" }}>
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-bold underline" style={{ color: "var(--brand)" }}>
              Log in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
