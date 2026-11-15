import type { Metadata } from "next";
import { Hanken_Grotesk, Newsreader } from "next/font/google";
import { defaultOgImage, getSiteUrl } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";
import "./globals.css";
import "./theme.css";
import "./showcase.css";

// Türkçe karakterler (ş, ğ, ı, İ) için latin-ext alt kümesi gerekli.
const display = Newsreader({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
});

const body = Hanken_Grotesk({
  variable: "--font-body",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { siteTitle } = await getSiteSettings();
  const siteUrl = getSiteUrl();
  const ogImage = defaultOgImage();
  const description =
    "Mali müşavirlik, muhasebe, vergi danışmanlığı, bordro ve şirket kuruluş hizmetleri. Vergi takvimini kaçırmadan, şeffaf raporlama ile yanınızdayız.";

  return {
    // metadataBase yalnızca SITE_URL biliniyorsa verilir (göreli adresler için gerekli).
    ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
    title: {
      default: `${siteTitle} | Mali Müşavirlik ve Vergi Danışmanlığı`,
      template: `%s | ${siteTitle}`,
    },
    description,
    openGraph: {
      type: "website",
      locale: "tr_TR",
      siteName: siteTitle,
      title: siteTitle,
      description,
      ...(ogImage
        ? { images: [{ url: ogImage, width: 1200, height: 630, alt: siteTitle }] }
        : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: siteTitle,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${display.variable} ${body.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        {/* Giriş animasyonları yalnızca JS çalışıyorsa devreye girer; çalışmazsa içerik hep görünür kalır. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('js');setTimeout(function(){if(!window.__fx)document.documentElement.classList.remove('js')},5000)",
          }}
        />
      </head>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
