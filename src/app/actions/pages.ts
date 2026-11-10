"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type PageState = {
  error?: string;
  success?: string;
};

const aboutSchema = z.object({
  aboutIntro: z.string().trim().min(20).max(600),
  aboutApproachTitle: z.string().trim().min(2).max(80),
  aboutApproachText: z.string().trim().min(20).max(1200),
  aboutScopeTitle: z.string().trim().min(2).max(80),
  aboutScopeText: z.string().trim().min(20).max(1200),
  aboutPromiseTitle: z.string().trim().min(2).max(80),
  aboutPromiseText: z.string().trim().min(20).max(1200),
});

const contactSchema = z.object({
  contactHeroTitle: z.string().trim().min(2).max(80),
  contactHeroText: z.string().trim().min(10).max(400),
  contactEmail: z.string().trim().email("Geçerli e-posta girin").max(120),
  contactPhone: z.string().trim().min(5).max(40),
  contactAddress: z.string().trim().min(3).max(160),
  contactHours: z.string().trim().min(3).max(80),
});

export async function updateAboutAction(
  _prev: PageState,
  formData: FormData,
): Promise<PageState> {
  try {
    await requireSession();
  } catch {
    return { error: "Oturum gerekli" };
  }

  const parsed = aboutSchema.safeParse({
    aboutIntro: formData.get("aboutIntro"),
    aboutApproachTitle: formData.get("aboutApproachTitle"),
    aboutApproachText: formData.get("aboutApproachText"),
    aboutScopeTitle: formData.get("aboutScopeTitle"),
    aboutScopeText: formData.get("aboutScopeText"),
    aboutPromiseTitle: formData.get("aboutPromiseTitle"),
    aboutPromiseText: formData.get("aboutPromiseText"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" };
  }

  await prisma.setting.upsert({
    where: { id: "main" },
    update: parsed.data,
    create: {
      id: "main",
      siteTitle: "Mali Müşavirlik",
      ...parsed.data,
    },
  });

  revalidatePath("/hakkimizda");
  revalidatePath("/admin/hakkimizda");
  return { success: "Hakkımızda sayfası kaydedildi" };
}

export async function updateContactAction(
  _prev: PageState,
  formData: FormData,
): Promise<PageState> {
  try {
    await requireSession();
  } catch {
    return { error: "Oturum gerekli" };
  }

  const parsed = contactSchema.safeParse({
    contactHeroTitle: formData.get("contactHeroTitle"),
    contactHeroText: formData.get("contactHeroText"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    contactAddress: formData.get("contactAddress"),
    contactHours: formData.get("contactHours"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" };
  }

  await prisma.setting.upsert({
    where: { id: "main" },
    update: parsed.data,
    create: {
      id: "main",
      siteTitle: "Mali Müşavirlik",
      ...parsed.data,
    },
  });

  revalidatePath("/iletisim");
  revalidatePath("/", "layout");
  revalidatePath("/admin/iletisim");
  return { success: "İletişim sayfası kaydedildi" };
}
