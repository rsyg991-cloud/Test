import type { Metadata } from "next";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = { title: "Create your account" };

export default function RegisterPage() {
  return (
    <>
      <h1 className="font-display text-4xl font-bold tracking-tight">Start your climb</h1>
      <p className="mb-8 mt-2" style={{ color: "var(--muted)" }}>
        Create a free account, then take a 15-minute placement test.
      </p>
      <AuthForm mode="register" />
    </>
  );
}
