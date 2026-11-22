import type { Metadata } from "next";
import { getT } from "@/lib/i18n/server";
import { AuthForm } from "../AuthForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("meta.register") };
}

export default async function RegisterPage() {
  const { t } = await getT();
  return (
    <>
      <h1 className="font-display text-4xl">{t("auth.registerTitle")}</h1>
      <p className="mb-8 mt-2" style={{ color: "var(--muted)" }}>
        {t("auth.registerSubtitle")}
      </p>
      <AuthForm mode="register" />
    </>
  );
}
