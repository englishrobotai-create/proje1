"use client";

import { useActionState } from "react";
import { updateContactAction, type PageState } from "@/app/actions/pages";
import type { SiteSettings } from "@/lib/settings";

const initial: PageState = {};

export function ContactFormAdmin({ settings }: { settings: SiteSettings }) {
  const [state, action, pending] = useActionState(
    updateContactAction,
    initial,
  );

  return (
    <form action={action} className="admin-form">
      <label>
        Sayfa başlığı
        <input
          name="contactHeroTitle"
          required
          defaultValue={settings.contactHeroTitle}
        />
      </label>
      <label>
        Üst açıklama
        <textarea
          name="contactHeroText"
          required
          rows={3}
          defaultValue={settings.contactHeroText}
        />
      </label>

      <h3 className="admin-subtitle">Ofis bilgileri</h3>
      <div className="form-row">
        <label>
          E-posta
          <input
            name="contactEmail"
            type="email"
            required
            defaultValue={settings.contactEmail}
          />
        </label>
        <label>
          Telefon
          <input
            name="contactPhone"
            required
            defaultValue={settings.contactPhone}
          />
        </label>
      </div>
      <label>
        Adres
        <input
          name="contactAddress"
          required
          defaultValue={settings.contactAddress}
        />
      </label>
      <label>
        Çalışma saatleri
        <input
          name="contactHours"
          required
          defaultValue={settings.contactHours}
        />
      </label>

      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
