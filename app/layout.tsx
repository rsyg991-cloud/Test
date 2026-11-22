import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { dirOf } from "@/lib/i18n/config";
import { I18nProvider } from "@/lib/i18n/client";
import { getT, MESSAGES } from "@/lib/i18n/server";
import "./globals.css";

// Thmanyah (font.thmanyah.com): free for personal and commercial use, including website interfaces.
// One family for both scripts: Sans for text, Serif Display Black for headlines (the logo's "بلبل").
const thmanyahSans = localFont({
  src: [
    { path: "./fonts/thmanyah/thmanyahsans-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/thmanyah/thmanyahsans-Medium.woff2", weight: "500", style: "normal" },
    { path: "./fonts/thmanyah/thmanyahsans-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/thmanyah/thmanyahsans-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-thmanyah",
  display: "swap",
  fallback: ["Tahoma", "Segoe UI", "system-ui", "sans-serif"],
});
const thmanyahDisplay = localFont({
  src: [{ path: "./fonts/thmanyah/thmanyahserifdisplay-Black.woff2", weight: "900", style: "normal" }],
  variable: "--font-thmanyah-display",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap", weight: ["500", "700"] });

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
    <html lang={locale} dir={dirOf(locale)} className={`${thmanyahSans.variable} ${thmanyahDisplay.variable} ${jetbrains.variable}`}>
      <body className="min-h-dvh">
        <I18nProvider locale={locale} messages={MESSAGES[locale]}>
          {children}
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  );
}
