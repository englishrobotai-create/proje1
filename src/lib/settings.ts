import { prisma } from "./db";
import { DEFAULT_NEWS_URL } from "./external-news";

export type SiteSettings = {
  siteTitle: string;
  facebook: string;
  instagram: string;
  linkedin: string;
  twitter: string;
  youtube: string;
  whatsapp: string;
  externalNewsUrl: string;
  externalNewsLabel: string;
  aboutIntro: string;
  aboutApproachTitle: string;
  aboutApproachText: string;
  aboutScopeTitle: string;
  aboutScopeText: string;
  aboutPromiseTitle: string;
  aboutPromiseText: string;
  contactHeroTitle: string;
  contactHeroText: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  contactHours: string;
  servicesIntro: string;
};

const defaults = {
  aboutIntro:
    "işletmelerin vergi ve muhasebe süreçlerini düzenli, anlaşılır ve denetlenebilir şekilde yönetmesi için kurulmuş bir mali müşavirlik ofisidir.",
  aboutApproachText:
    "Her müşteriye aynı standart kaliteyi sunarız: net iletişim, zamanında teslim ve belgelenmiş süreçler. Amacımız yalnızca beyanları tamamlamak değil, işletmenizin mali kararlarını daha sağlam temellere oturtmaktır.",
  aboutScopeText:
    "Limited şirketler, anonim şirketler, şahıs işletmeleri ve serbest meslek sahipleriyle çalışıyoruz. Sektör fark etmeksizin ortak ihtiyacınız düzen ve güvenilir danışmanlıktır.",
  aboutPromiseText:
    "Kaçırılmayan tarihler, anlaşılır raporlar ve ihtiyaç anında hızlı dönüş. Büyürken yanınızda duran bir mali iş ortağı olmayı hedefleriz.",
  contactHeroText:
    "ile görüşmek için formu doldurun. Mesajlarınız yönetim paneline düşer.",
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const setting = await prisma.setting.findUnique({ where: { id: "main" } });
  const siteTitle = setting?.siteTitle ?? "Mali Müşavirlik";

  return {
    siteTitle,
    facebook: setting?.facebook ?? "",
    instagram: setting?.instagram ?? "",
    linkedin: setting?.linkedin ?? "",
    twitter: setting?.twitter ?? "",
    youtube: setting?.youtube ?? "",
    whatsapp: setting?.whatsapp ?? "",
    externalNewsUrl: setting?.externalNewsUrl || DEFAULT_NEWS_URL,
    externalNewsLabel:
      setting?.externalNewsLabel || "Özcan Kutlu — Güncel Mali Gelişmeler",
    aboutIntro:
      setting?.aboutIntro || `${siteTitle}, ${defaults.aboutIntro}`,
    aboutApproachTitle: setting?.aboutApproachTitle || "Çalışma yaklaşımımız",
    aboutApproachText: setting?.aboutApproachText || defaults.aboutApproachText,
    aboutScopeTitle: setting?.aboutScopeTitle || "Kimlerle çalışıyoruz",
    aboutScopeText: setting?.aboutScopeText || defaults.aboutScopeText,
    aboutPromiseTitle: setting?.aboutPromiseTitle || "Ne vaat ediyoruz",
    aboutPromiseText: setting?.aboutPromiseText || defaults.aboutPromiseText,
    contactHeroTitle: setting?.contactHeroTitle || "Birlikte planlayalım",
    contactHeroText:
      setting?.contactHeroText ||
      `${siteTitle} ${defaults.contactHeroText}`,
    contactEmail: setting?.contactEmail || "info@ornek-mm.com",
    contactPhone: setting?.contactPhone || "+90 (212) 000 00 00",
    contactAddress: setting?.contactAddress || "İstanbul, Türkiye",
    contactHours: setting?.contactHours || "Hafta içi 09:00 – 18:00",
    servicesIntro:
      setting?.servicesIntro ||
      "Standart hizmet paketimiz, mali müşavirlik ofisinizin temel ihtiyaçlarını kapsayacak şekilde hazırlanmıştır.",
  };
}

export function getActiveSocialLinks(settings: SiteSettings) {
  return [
    { key: "facebook", label: "Facebook", href: settings.facebook },
    { key: "instagram", label: "Instagram", href: settings.instagram },
    { key: "linkedin", label: "LinkedIn", href: settings.linkedin },
    { key: "twitter", label: "X", href: settings.twitter },
    { key: "youtube", label: "YouTube", href: settings.youtube },
    { key: "whatsapp", label: "WhatsApp", href: settings.whatsapp },
  ].filter((item) => item.href.trim().length > 0);
}

export function slugify(text: string) {
  return text
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}
