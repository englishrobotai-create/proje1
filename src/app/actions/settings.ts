"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const schema = z.object({
  siteTitle: z
    .string()
    .trim()
    .min(2, "Başlık en az 2 karakter olmalı")
    .max(80, "Başlık en fazla 80 karakter olabilir"),
});

export type SettingsState = {
  error?: string;
  success?: string;
};

export async function updateSiteTitleAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  try {
    await requireSession();
  } catch {
    return { error: "Oturum gerekli" };
  }

  const parsed = schema.safeParse({
    siteTitle: formData.get("siteTitle"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" };
  }

  await prisma.setting.upsert({
    where: { id: "main" },
    update: { siteTitle: parsed.data.siteTitle },
    create: { id: "main", siteTitle: parsed.data.siteTitle },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin");
  revalidatePath("/admin/ayarlar");

  return { success: "Site başlığı güncellendi" };
}
