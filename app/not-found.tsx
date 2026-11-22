import Link from "next/link";
import { Logo } from "@/components/ui";
import { getT } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <div className="grid min-h-dvh place-items-center p-6 text-center">
      <div>
        <Logo />
        <h1 className="mt-8 font-display text-5xl">{t("notFound.title")}</h1>
        <p className="mt-3" style={{ color: "var(--muted)" }}>
          {t("notFound.body")}
        </p>
        <Link href="/" className="btn btn-primary mt-6">
          {t("notFound.cta")}
        </Link>
      </div>
    </div>
  );
}
