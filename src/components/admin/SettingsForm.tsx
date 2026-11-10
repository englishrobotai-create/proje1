"use client";

import { useActionState } from "react";
import {
  updateSiteTitleAction,
  type SettingsState,
} from "@/app/actions/settings";

const initial: SettingsState = {};

export function SettingsForm({ siteTitle }: { siteTitle: string }) {
  const [state, action, pending] = useActionState(
    updateSiteTitleAction,
    initial,
  );

  return (
    <form action={action} className="admin-form">
      <label>
        Site başlığı
        <input
          name="siteTitle"
          required
          minLength={2}
          maxLength={80}
          defaultValue={siteTitle}
        />
      </label>
      <p className="form-hint">
        Bu başlık sitenin logosunda, sekme başlığında ve alt bilgide görünür.
      </p>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
