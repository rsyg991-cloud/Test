import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Archivo_Black, JetBrains_Mono, Noto_Kufi_Arabic, Public_Sans } from "next/font/google";
import { dirOf } from "@/lib/i18n/config";
import { I18nProvider } from "@/lib/i18n/client";
import { getT, MESSAGES } from "@/lib/i18n/server";
import "./globals.css";

const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public", display: "swap", weight: ["400", "600", "700", "800"] });
const archivo = Archivo_Black({ subsets: ["latin"], variable: "--font-archivo", display: "swap", weight: "400" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap", weight: ["500", "700"] });
const kufi = Noto_Kufi_Arabic({ subsets: ["arabic"], variable: "--font-kufi", display: "swap", weight: ["500", "700"] });

const siteHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    metadataBase: new URL(siteHost ? `https://${siteHost}` : "http://localhost:3000"),
    title: { default: t("meta.title"), template: t("meta.template") },
    description: t("meta.description"),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#08131d" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await getT();
  return (
    <html lang={locale} dir={dirOf(locale)} className={`${publicSans.variable} ${archivo.variable} ${jetbrains.variable} ${kufi.variable}`}>
      <body className="min-h-dvh">
        <I18nProvider locale={locale} messages={MESSAGES[locale]}>
          {children}
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  );
}
