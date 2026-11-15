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

      <h3 className="admin-subtitle">Güncel mali gelişmeler</h3>
      <p className="form-hint">
        Ana sayfadaki “CANLI” haber şeridi bu adresten beslenir. Ne yazacağınızı bilmiyorsanız olduğu gibi bırakın.
      </p>
      <div className="form-row">
        <label>
          Haber kaynağı adresi
          <input
            name="externalNewsUrl"
            type="url"
            placeholder="https://www.ozcankutlu.com/api/news"
            defaultValue={settings.externalNewsUrl}
          />
        </label>
        <label>
          Kaynak etiketi
          <input
            name="externalNewsLabel"
            maxLength={80}
            placeholder="Güncel Mali Gelişmeler"
            defaultValue={settings.externalNewsLabel}
          />
        </label>
      </div>

      {/* Sosyal medya ayrı sayfada; mevcut değerleri koru */}
      <input type="hidden" name="facebook" value={settings.facebook} />
      <input type="hidden" name="instagram" value={settings.instagram} />
      <input type="hidden" name="linkedin" value={settings.linkedin} />
      <input type="hidden" name="twitter" value={settings.twitter} />
      <input type="hidden" name="youtube" value={settings.youtube} />
      <input type="hidden" name="whatsapp" value={settings.whatsapp} />

      <p className="form-hint">
        Sosyal medya ikonları ve linkleri için{" "}
        <a href="/admin/sosyal-medya">Sosyal Medya</a> menüsünü kullanın.
      </p>

      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
