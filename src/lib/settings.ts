import { prisma } from "./db";

export async function getSiteSettings() {
  const setting = await prisma.setting.findUnique({ where: { id: "main" } });
  return {
    siteTitle: setting?.siteTitle ?? "Mali Müşavirlik",
  };
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
