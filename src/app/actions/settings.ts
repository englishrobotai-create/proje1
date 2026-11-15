"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  TITLE_SCALE_MAX,
  TITLE_SCALE_MIN,
  isTitleFontKey,
} from "@/lib/title-fonts";

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .refine(
    (value) => value === "" || /^https?:\/\//i.test(value),
    "Bağlantı http:// veya https:// ile başlamalı",
  );

const schema = z.object({
  siteTitle: z
    .string()
    .trim()
    .min(2, "Başlık en az 2 karakter olmalı")
    .max(80, "Başlık en fazla 80 karakter olabilir"),
  facebook: optionalUrl,
  instagram: optionalUrl,
  linkedin: optionalUrl,
  twitter: optionalUrl,
  youtube: optionalUrl,
  whatsapp: optionalUrl,
  externalNewsUrl: optionalUrl,
  externalNewsLabel: z.string().trim().max(80),
  // Başlık görünümü yalnızca Site Ayarları formundan gelir. Sosyal Medya formu gibi bu alanları
  // göndermeyen formlar mevcut değeri bozmasın diye ikisi de isteğe bağlıdır (yoksa güncellenmez).
  titleFont: z
    .string()
    .refine(isTitleFontKey, "Geçersiz yazı tipi seçildi")
    .optional(),
  titleScale: z
    .number("Başlık boyutu bir sayı olmalı")
    .int("Başlık boyutu tam sayı olmalı")
    .min(TITLE_SCALE_MIN, `Başlık boyutu en az %${TITLE_SCALE_MIN} olabilir`)
    .max(TITLE_SCALE_MAX, `Başlık boyutu en fazla %${TITLE_SCALE_MAX} olabilir`)
    .optional(),
});

export type SettingsState = {
  error?: string;
  success?: string;
};

export async function updateSettingsAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  try {
    await requireSession();
  } catch {
    return { error: "Oturum gerekli" };
  }

  const titleFontRaw = formData.get("titleFont");
  const titleScaleRaw = formData.get("titleScale");

  const parsed = schema.safeParse({
    siteTitle: formData.get("siteTitle"),
    facebook: formData.get("facebook") ?? "",
    instagram: formData.get("instagram") ?? "",
    linkedin: formData.get("linkedin") ?? "",
    twitter: formData.get("twitter") ?? "",
    youtube: formData.get("youtube") ?? "",
    whatsapp: formData.get("whatsapp") ?? "",
    externalNewsUrl: formData.get("externalNewsUrl") ?? "",
    externalNewsLabel: formData.get("externalNewsLabel") ?? "",
    titleFont: typeof titleFontRaw === "string" ? titleFontRaw : undefined,
    titleScale:
      typeof titleScaleRaw === "string" && titleScaleRaw.trim() !== ""
        ? Number(titleScaleRaw)
        : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" };
  }

  const data = {
    ...parsed.data,
    externalNewsUrl:
      parsed.data.externalNewsUrl || "https://www.ozcankutlu.com/api/news",
    externalNewsLabel:
      parsed.data.externalNewsLabel ||
      "Güncel Mali Gelişmeler",
  };

  await prisma.setting.upsert({
    where: { id: "main" },
    update: data,
    create: { id: "main", ...data },
  });

  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/ayarlar");

  return { success: "Ayarlar kaydedildi" };
}
