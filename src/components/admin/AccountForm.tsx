"use client";

import { useActionState } from "react";
import { updateAccountAction, type AccountState } from "@/app/actions/account";

const initial: AccountState = {};

export function AccountForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(updateAccountAction, initial);

  return (
    <form action={action} className="admin-form">
      <label>
        E-posta (giriş adı)
        <input
          name="email"
          type="email"
          required
          maxLength={120}
          autoComplete="username"
          defaultValue={state.email ?? email}
        />
      </label>

      <h3 className="admin-subtitle">Yeni şifre (isteğe bağlı)</h3>
      <label>
        Yeni şifre
        <input
          name="newPassword"
          type="password"
          minLength={10}
          maxLength={72}
          autoComplete="new-password"
        />
      </label>
      <label>
        Yeni şifre (tekrar)
        <input
          name="confirmPassword"
          type="password"
          maxLength={72}
          autoComplete="new-password"
        />
      </label>
      <p className="form-hint">
        Şifreyi değiştirmek istemiyorsanız boş bırakın. En az 10 karakter olmalı.
        Şifre değişince diğer cihazlardaki oturumlar kapanır.
      </p>

      <h3 className="admin-subtitle">Onay</h3>
      <label>
        Mevcut şifre
        <input
          name="currentPassword"
          type="password"
          required
          maxLength={200}
          autoComplete="current-password"
        />
      </label>
      <p className="form-hint">Her değişiklik için mevcut şifreniz gerekir.</p>

      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
