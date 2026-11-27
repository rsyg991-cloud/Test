import type { Metadata } from "next";
import { countryOptions } from "@/lib/countries";
import { getT } from "@/lib/i18n/server";
import { AuthForm } from "../AuthForm";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("meta.login") };
}

export default async function LoginPage() {
  const { t, locale } = await getT();
  return (
    <>
      <h1 className="font-display text-4xl">{t("auth.loginTitle")}</h1>
      <p className="mb-8 mt-2" style={{ color: "var(--muted)" }}>
        {t("auth.loginSubtitle")}
      </p>
      <AuthForm mode="login" countries={countryOptions(locale)} />
    </>
  );
}
