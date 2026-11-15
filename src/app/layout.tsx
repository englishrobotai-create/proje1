import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Hanken_Grotesk,
  Inter,
  Lora,
  Merriweather,
  Montserrat,
  Newsreader,
  Playfair_Display,
  Poppins,
  Raleway,
} from "next/font/google";
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

// Site başlığı için Ayarlar'dan seçilebilen ek yazı tipleri (bkz. src/lib/title-fonts.ts).
// preload: false → seçilmeyen yazı tipleri için sayfa başına ön yükleme yapılmaz; tarayıcı yalnızca
// sayfada gerçekten kullanılan yazı tipinin dosyasını indirir.
// Not: next/font seçenekleri doğrudan yazılmış (literal) değerler olmalıdır; ortak bir nesne
// yayılarak (spread) verilemez.
const titlePlayfair = Playfair_Display({
  variable: "--font-title-playfair",
  subsets: ["latin", "latin-ext"],
  preload: false,
});
const titleMerriweather = Merriweather({
  variable: "--font-title-merriweather",
  subsets: ["latin", "latin-ext"],
  preload: false,
});
const titleLora = Lora({
  variable: "--font-title-lora",
  subsets: ["latin", "latin-ext"],
  preload: false,
});
const titleCormorant = Cormorant_Garamond({
  variable: "--font-title-cormorant",
  subsets: ["latin", "latin-ext"],
  preload: false,
});
const titleInter = Inter({
  variable: "--font-title-inter",
  subsets: ["latin", "latin-ext"],
  preload: false,
});
const titleMontserrat = Montserrat({
  variable: "--font-title-montserrat",
  subsets: ["latin", "latin-ext"],
  preload: false,
});
const titleRaleway = Raleway({
  variable: "--font-title-raleway",
  subsets: ["latin", "latin-ext"],
  preload: false,
});
// Poppins değişken yazı tipi değildir; başlıkta kullanılan kalınlıklar belirtilmelidir.
const titlePoppins = Poppins({
  variable: "--font-title-poppins",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  preload: false,
});

const titleFontVariables = [
  titlePlayfair,
  titleMerriweather,
  titleLora,
  titleCormorant,
  titleInter,
  titleMontserrat,
  titleRaleway,
  titlePoppins,
]
  .map((font) => font.variable)
  .join(" ");

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
      className={`${display.variable} ${body.variable} ${titleFontVariables} h-full`}
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
