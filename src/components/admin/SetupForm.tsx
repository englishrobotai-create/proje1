"use client";

import { useActionState } from "react";
import { setupAdminAction, type AuthState } from "@/app/actions/auth";

const initial: AuthState = {};

export function SetupForm() {
  const [state, action, pending] = useActionState(setupAdminAction, initial);

  return (
    <form action={action} className="admin-form">
      <label>
        Adınız (isteğe bağlı)
        <input
          name="name"
          type="text"
          maxLength={80}
          autoComplete="name"
          placeholder="Site Yöneticisi"
        />
      </label>
      <label>
        E-posta
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          placeholder="siz@ofis.com"
        />
      </label>
      <label>
        Şifre
        <input
          name="password"
          type="password"
          required
          minLength={10}
          maxLength={72}
          autoComplete="new-password"
        />
      </label>
      <label>
        Şifre (tekrar)
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={10}
          maxLength={72}
          autoComplete="new-password"
        />
      </label>
      <p className="form-hint">
        Şifre en az 10 karakter olmalı. Bu bilgilerle /admin paneline
        gireceksiniz; güvenli bir şifre seçin.
      </p>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Oluşturuluyor..." : "Yönetici hesabını oluştur"}
      </button>
    </form>
  );
}
