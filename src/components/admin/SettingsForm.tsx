"use client";

import { useActionState } from "react";
import {
  updateSettingsAction,
  type SettingsState,
} from "@/app/actions/settings";
import type { SiteSettings } from "@/lib/settings";

const initial: SettingsState = {};

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action, pending] = useActionState(
    updateSettingsAction,
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
          defaultValue={settings.siteTitle}
        />
      </label>
      <p className="form-hint">
        Bu başlık sitenin logosunda, sekme başlığında ve alt bilgide görünür.
      </p>

      <h3 className="admin-subtitle">Sosyal medya bağlantıları</h3>
      <p className="form-hint">
        Boş bırakılan alanlar sitede gösterilmez. Adresler https:// ile
        başlamalıdır.
      </p>

      <div className="form-row">
        <label>
          Facebook
          <input
            name="facebook"
            type="url"
            placeholder="https://facebook.com/..."
            defaultValue={settings.facebook}
          />
        </label>
        <label>
          Instagram
          <input
            name="instagram"
            type="url"
            placeholder="https://instagram.com/..."
            defaultValue={settings.instagram}
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          LinkedIn
          <input
            name="linkedin"
            type="url"
            placeholder="https://linkedin.com/company/..."
            defaultValue={settings.linkedin}
          />
        </label>
        <label>
          X (Twitter)
          <input
            name="twitter"
            type="url"
            placeholder="https://x.com/..."
            defaultValue={settings.twitter}
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          YouTube
          <input
            name="youtube"
            type="url"
            placeholder="https://youtube.com/..."
            defaultValue={settings.youtube}
          />
        </label>
        <label>
          WhatsApp
          <input
            name="whatsapp"
            type="url"
            placeholder="https://wa.me/905xxxxxxxxx"
            defaultValue={settings.whatsapp}
          />
        </label>
      </div>

      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
