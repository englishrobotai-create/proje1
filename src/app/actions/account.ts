"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  allowAdminAccountAttempt,
  createSession,
  hashPassword,
  requireSession,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/db";

export type AccountState = {
  error?: string;
  success?: string;
  /** Hata sonrası form sıfırlanınca yazılan e-posta kaybolmasın. */
  email?: string;
};

// README'de yazan varsayılan ve çok bilinen şifreler.
const WEAK_PASSWORDS = new Set(["admin123!", "admin123", "1234567890", "password123"]);

const schema = z.object({
  currentPassword: z.string().min(1, "Mevcut şifrenizi girin").max(200),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Geçerli bir e-posta girin")
    .max(120, "E-posta en fazla 120 karakter olabilir"),
  newPassword: z.string().max(72, "Şifre en fazla 72 karakter olabilir"),
  confirmPassword: z.string().max(72),
});

export async function updateAccountAction(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  let session;
  try {
    session = await requireSession();
  } catch {
    return { error: "Oturum gerekli" };
  }

  const typedEmail = String(formData.get("email") ?? "");

  if (!allowAdminAccountAttempt(session.id)) {
    return {
      error: "Çok fazla deneme yaptınız. Lütfen 15 dakika sonra tekrar deneyin.",
      email: typedEmail,
    };
  }

  const parsed = schema.safeParse({
    currentPassword: formData.get("currentPassword") ?? "",
    email: formData.get("email") ?? "",
    newPassword: formData.get("newPassword") ?? "",
    confirmPassword: formData.get("confirmPassword") ?? "",
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Geçersiz veri",
      email: typedEmail,
    };
  }
  const { currentPassword, email, newPassword, confirmPassword } = parsed.data;

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return { error: "Hesap bulunamadı", email };

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    return { error: "Mevcut şifre hatalı", email };
  }

  const wantsPassword = newPassword !== "";
  if (wantsPassword) {
    if (newPassword.length < 10) {
      return { error: "Yeni şifre en az 10 karakter olmalı", email };
    }
    if (newPassword !== confirmPassword) {
      return { error: "Yeni şifre ile tekrarı aynı değil", email };
    }
    if (newPassword === currentPassword) {
      return { error: "Yeni şifre mevcut şifreden farklı olmalı", email };
    }
    if (WEAK_PASSWORDS.has(newPassword.toLowerCase())) {
      return { error: "Bu şifre çok bilinen bir şifre; başka bir şifre seçin", email };
    }
  }

  const emailChanged = email !== user.email;
  if (!wantsPassword && !emailChanged) {
    return { error: "Değişiklik yok: e-postayı ya da yeni şifreyi değiştirin", email };
  }

  if (emailChanged) {
    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken && taken.id !== user.id) {
      return { error: "Bu e-posta başka bir hesapta kullanılıyor", email };
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(emailChanged ? { email } : {}),
      ...(wantsPassword ? { passwordHash: await hashPassword(newPassword) } : {}),
    },
  });

  // Şifre değiştiyse eski oturumlar düştü; bu cihaz yeni parmak izli oturumla devam eder.
  await createSession(
    { id: updated.id, email: updated.email, name: updated.name },
    updated.passwordHash,
  );

  revalidatePath("/admin", "layout");

  return {
    success: wantsPassword
      ? "Bilgiler kaydedildi. Şifreniz değişti; diğer cihazlardaki oturumlar kapatıldı."
      : "E-posta güncellendi.",
    email: updated.email,
  };
}
