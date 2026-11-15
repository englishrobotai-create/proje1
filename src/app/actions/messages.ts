"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { after } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import {
  CONTACT_CHANNELS,
  CONTACT_TIMES,
  pickOption,
} from "@/lib/contact-options";
import { prisma } from "@/lib/db";
import { getMailStatus, notifyNewMessage, sendTestMail } from "@/lib/mail";
import { allowRequest } from "@/lib/rate-limit";
import { getSiteSettings } from "@/lib/settings";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Adınızı girin").max(80),
  email: z.string().trim().email("Geçerli e-posta girin"),
  phone: z.string().trim().max(30).optional(),
  subject: z.string().trim().max(120).optional(),
  body: z.string().trim().min(10, "Mesaj en az 10 karakter olmalı").max(2000),
});

export type ContactState = {
  error?: string;
  success?: string;
};

const SUCCESS_TEXT =
  "Talebiniz alındı. En kısa sürede sizinle iletişime geçeceğiz.";

async function clientKey(): Promise<{ key: string; limit: number }> {
  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip")?.trim() ||
    "";
  // Adres alınamıyorsa herkes aynı kovaya düşer; meşru ziyaretçiyi kilitlememek için daha geniş sınır.
  return ip ? { key: ip, limit: 5 } : { key: "unknown", limit: 30 };
}

export async function sendContactAction(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Bal küpü alanı: botlar doldurur, insanlar görmez. Kaydetmeden başarılı gibi yanıtla.
  if (String(formData.get("website") ?? "").trim() !== "") {
    return { success: SUCCESS_TEXT };
  }

  const phone = String(formData.get("phone") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: phone || undefined,
    subject: subject || undefined,
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz form" };
  }

  const { key, limit } = await clientKey();
  if (!allowRequest(`contact:${key}`, limit, 10 * 60 * 1000)) {
    return {
      error:
        "Kısa sürede çok fazla mesaj gönderildi. Lütfen biraz sonra tekrar deneyin ya da bizi arayın.",
    };
  }

  const channel = pickOption(CONTACT_CHANNELS, formData.get("channel"));
  const time = pickOption(CONTACT_TIMES, formData.get("time"));
  const body = `${parsed.data.body}\n\nGörüşme tercihi: ${channel}, ${time}`;

  const message = await prisma.message.create({
    data: { ...parsed.data, body },
  });
  revalidatePath("/admin/mesajlar");
  revalidatePath("/admin");

  // Yanıtı geciktirmeden, kayıttan sonra bildirim e-postası gönder. Hata olsa da mesaj panelde durur.
  after(async () => {
    try {
      const settings = await getSiteSettings();
      await notifyNewMessage(message, settings);
    } catch (error) {
      console.error(
        "[e-posta] Bildirim gönderilemedi:",
        error instanceof Error ? error.message : error,
      );
    }
  });

  return { success: SUCCESS_TEXT };
}

export async function sendTestMailAction(
  _prev: ContactState,
): Promise<ContactState> {
  try {
    await requireSession();
  } catch {
    return { error: "Oturum gerekli" };
  }

  const settings = await getSiteSettings();
  const status = getMailStatus(settings);
  if (!status.ready) return { error: status.detail };

  try {
    const recipient = await sendTestMail(settings);
    return {
      success: `Test e-postası ${recipient} adresine gönderildi. Gelen kutusunu ve spam klasörünü kontrol edin.`,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "bilinmeyen hata";
    return { error: `Gönderilemedi: ${reason.slice(0, 200)}` };
  }
}

export async function markMessageReadAction(id: string) {
  await requireSession();
  await prisma.message.update({
    where: { id },
    data: { read: true },
  });
  revalidatePath("/admin/mesajlar");
  revalidatePath("/admin");
}

export async function deleteMessageAction(id: string) {
  await requireSession();
  await prisma.message.delete({ where: { id } });
  revalidatePath("/admin/mesajlar");
  revalidatePath("/admin");
}
