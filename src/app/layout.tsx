import type { Metadata } from "next";
import { Libre_Baskerville, Manrope } from "next/font/google";
import { getSiteSettings } from "@/lib/settings";
import "./globals.css";

const display = Libre_Baskerville({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { siteTitle } = await getSiteSettings();
  return {
    title: {
      default: siteTitle,
      template: `%s | ${siteTitle}`,
    },
    description:
      "Mali müşavirlik, muhasebe, vergi danışmanlığı ve şirket kuruluş hizmetleri.",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={`${display.variable} ${body.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
