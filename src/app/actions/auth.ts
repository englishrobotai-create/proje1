"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  allowAdminLoginAttempt,
  allowAdminSetupAttempt,
  createSession,
  destroySession,
  hashPassword,
  loginWithCredentials,
  needsAdminSetup,
} from "@/lib/auth";
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from "@/lib/default-admin";
import { prisma } from "@/lib/db";

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(1, "Şifre gerekli"),
});

const WEAK_PASSWORDS = new Set([
  "admin123!",
  "admin123",
  "1234567890",
  "password123",
  DEFAULT_ADMIN_PASSWORD.toLowerCase(),
]);

const setupSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Geçerli bir e-posta girin")
      .max(120, "E-posta en fazla 120 karakter olabilir"),
    password: z
      .string()
      .min(10, "Şifre en az 10 karakter olmalı")
      .max(72, "Şifre en fazla 72 karakter olabilir"),
    confirmPassword: z.string().max(72),
    name: z.string().trim().max(80, "Ad en fazla 80 karakter olabilir"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Şifre ile tekrarı aynı değil",
    path: ["confirmPassword"],
  })
  .refine((data) => !WEAK_PASSWORDS.has(data.password.toLowerCase()), {
    message: "Bu şifre çok bilinen bir şifre; başka bir şifre seçin",
    path: ["password"],
  })
  .refine((data) => data.email !== DEFAULT_ADMIN_EMAIL, {
    message: "Örnek e-posta kullanılamaz. Kendi ofis e-postanızı yazın.",
    path: ["email"],
  })
  .refine(
    (data) => data.name === "" || data.name.length >= 2,
    {
      message: "Ad en az 2 karakter olmalı",
      path: ["name"],
    },
  );

export type AuthState = {
  error?: string;
};

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (await needsAdminSetup()) {
    redirect("/admin/kurulum");
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz form" };
  }

  if (!(await allowAdminLoginAttempt(parsed.data.email))) {
    return {
      error: "Çok fazla deneme yaptınız. Lütfen 15 dakika sonra tekrar deneyin.",
    };
  }

  const user = await loginWithCredentials(
    parsed.data.email,
    parsed.data.password,
  );

  if (!user) {
    return { error: "E-posta veya şifre hatalı" };
  }

  redirect("/admin");
}

/**
 * Veritabanında hiç yönetici yokken ilk hesabı oluşturur (tarayıcıdan, local seed gerekmez).
 * Bir kullanıcı oluşunca bu yol kapanır.
 */
export async function setupAdminAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!(await needsAdminSetup())) {
    return {
      error: "Kurulum zaten tamamlanmış. Giriş sayfasını kullanın.",
    };
  }

  if (!(await allowAdminSetupAttempt())) {
    return {
      error: "Çok fazla deneme yaptınız. Lütfen 15 dakika sonra tekrar deneyin.",
    };
  }

  const parsed = setupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    name: formData.get("name") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz form" };
  }

  const name =
    parsed.data.name.length >= 2 ? parsed.data.name : "Site Yöneticisi";
  const passwordHash = await hashPassword(parsed.data.password);

  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      if ((await tx.user.count()) > 0) {
        throw new Error("ALREADY_SETUP");
      }
      return tx.user.create({
        data: {
          email: parsed.data.email,
          name,
          passwordHash,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_SETUP") {
      return {
        error: "Kurulum zaten tamamlanmış. Giriş sayfasını kullanın.",
      };
    }
    throw error;
  }

  await createSession(
    { id: user.id, email: user.email, name: user.name },
    user.passwordHash,
  );
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/giris");
}
