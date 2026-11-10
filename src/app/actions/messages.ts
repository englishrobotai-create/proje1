"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

export async function sendContactAction(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
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

  await prisma.message.create({ data: parsed.data });
  revalidatePath("/admin/mesajlar");
  return { success: "Mesajınız alındı. En kısa sürede dönüş yapacağız." };
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
