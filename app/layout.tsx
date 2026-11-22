import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Archivo_Black, JetBrains_Mono, Noto_Kufi_Arabic, Public_Sans } from "next/font/google";
import "./globals.css";

const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public", display: "swap", weight: ["400", "600", "700", "800"] });
const archivo = Archivo_Black({ subsets: ["latin"], variable: "--font-archivo", display: "swap", weight: "400" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap", weight: ["500", "700"] });
const kufi = Noto_Kufi_Arabic({ subsets: ["arabic"], variable: "--font-kufi", display: "swap", weight: ["500", "700"], preload: false });

const siteHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;

export const metadata: Metadata = {
  metadataBase: new URL(siteHost ? `https://${siteHost}` : "http://localhost:3000"),
  title: { default: "Balbal — From any level to the IELTS band you need", template: "%s · Balbal" },
  description:
    "A guided IELTS journey from absolute beginner to Band 7+. Reading, Listening, Writing and Speaking in seven stages, with examiner-style feedback and a plan that fits your exam date.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#08131d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${publicSans.variable} ${archivo.variable} ${jetbrains.variable} ${kufi.variable}`}>
      <body className="min-h-dvh">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
