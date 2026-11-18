import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["opsz"] });

export const metadata: Metadata = {
  title: { default: "BandUp — Climb from B1 to Band 7+", template: "%s · BandUp" },
  description:
    "A guided IELTS journey in four stages. Reading, Listening, Writing and Speaking, with AI examiner feedback and a plan that fits your exam date.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf8f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1220" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${fraunces.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
