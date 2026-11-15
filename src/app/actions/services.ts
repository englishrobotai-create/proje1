"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseProcessSteps, saveServicesProcess } from "@/lib/services-process";

export type ServiceState = {
  error?: string;
  success?: string;
};

const serviceSchema = z.object({
  title: z.string().trim().min(2, "Başlık en az 2 karakter olmalı").max(100),
  description: z
    .string()
    .trim()
    .min(10, "Açıklama en az 10 karakter olmalı")
    .max(400),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

const introSchema = z.object({
  servicesIntro: z.string().trim().min(10).max(400),
});

const processSchema = z.object({
  servicesProcess: z
    .string()
    .trim()
    .min(5, "En az bir adım yazın (Başlık | Açıklama)")
    .max(1500, "Metin en fazla 1500 karakter olabilir"),
});

function revalidateServices() {
  revalidatePath("/hizmetler");
  revalidatePath("/");
  revalidatePath("/admin/hizmetler");
}

export async function updateServicesIntroAction(
  _prev: ServiceState,
  formData: FormData,
): Promise<ServiceState> {
  try {
    await requireSession();
  } catch {
    return { error: "Oturum gerekli" };
  }

  const parsed = introSchema.safeParse({
    servicesIntro: formData.get("servicesIntro"),
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

  revalidateServices();
  return { success: "Hizmetler sayfa açıklaması kaydedildi" };
}

export async function updateServicesProcessAction(
  _prev: ServiceState,
  formData: FormData,
): Promise<ServiceState> {
  try {
    await requireSession();
  } catch {
    return { error: "Oturum gerekli" };
  }

  const parsed = processSchema.safeParse({
    servicesProcess: formData.get("servicesProcess"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" };
  }

  if (parseProcessSteps(parsed.data.servicesProcess).length === 0) {
    return { error: "En az bir adım yazın (Başlık | Açıklama)" };
  }

  try {
    await saveServicesProcess(parsed.data.servicesProcess);
  } catch {
    return { error: "Kaydedilemedi. Lütfen tekrar deneyin." };
  }

  revalidateServices();
  return { success: "Çalışma adımları kaydedildi" };
}

export async function createServiceAction(
  _prev: ServiceState,
  formData: FormData,
): Promise<ServiceState> {
  try {
    await requireSession();
  } catch {
    return { error: "Oturum gerekli" };
  }

  const parsed = serviceSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    sortOrder: formData.get("sortOrder") || 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" };
  }

  await prisma.service.create({ data: parsed.data });
  revalidateServices();
  redirect("/admin/hizmetler");
}

export async function updateServiceAction(
  id: string,
  _prev: ServiceState,
  formData: FormData,
): Promise<ServiceState> {
  try {
    await requireSession();
  } catch {
    return { error: "Oturum gerekli" };
  }

  const parsed = serviceSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    sortOrder: formData.get("sortOrder") || 0,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" };
  }

  await prisma.service.update({ where: { id }, data: parsed.data });
  revalidateServices();
  redirect("/admin/hizmetler");
}

export async function deleteServiceAction(id: string) {
  await requireSession();
  await prisma.service.delete({ where: { id } });
  revalidateServices();
}
