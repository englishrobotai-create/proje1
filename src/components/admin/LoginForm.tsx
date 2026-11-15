"use client";

import { useActionState } from "react";
import { loginAction, type AuthState } from "@/app/actions/auth";

const initial: AuthState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form action={action} className="admin-form">
      <label>
        E-posta
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
        />
      </label>
      <label>
        Şifre
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </label>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Giriş yapılıyor..." : "Giriş Yap"}
      </button>
    </form>
  );
}
