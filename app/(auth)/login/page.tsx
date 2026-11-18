import type { Metadata } from "next";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="font-display text-4xl font-bold tracking-tight">Welcome back</h1>
      <p className="mb-8 mt-2" style={{ color: "var(--muted)" }}>
        Your streak is waiting for you.
      </p>
      <AuthForm mode="login" />
    </>
  );
}
