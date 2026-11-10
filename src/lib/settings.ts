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
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const setting = await prisma.setting.findUnique({ where: { id: "main" } });
  return {
    siteTitle: setting?.siteTitle ?? "Mali Müşavirlik",
    facebook: setting?.facebook ?? "",
    instagram: setting?.instagram ?? "",
    linkedin: setting?.linkedin ?? "",
    twitter: setting?.twitter ?? "",
    youtube: setting?.youtube ?? "",
    whatsapp: setting?.whatsapp ?? "",
    externalNewsUrl: setting?.externalNewsUrl || DEFAULT_NEWS_URL,
    externalNewsLabel: setting?.externalNewsLabel || "Özcan Kutlu Blog",
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
