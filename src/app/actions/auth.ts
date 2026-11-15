"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  allowAdminLoginAttempt,
  destroySession,
  loginWithCredentials,
} from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(1, "Şifre gerekli"),
});

export type AuthState = {
  error?: string;
};

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
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

export async function logoutAction() {
  await destroySession();
  redirect("/admin/giris");
}
