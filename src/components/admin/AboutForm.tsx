"use client";

import { useActionState } from "react";
import { updateAboutAction, type PageState } from "@/app/actions/pages";
import type { SiteSettings } from "@/lib/settings";

const initial: PageState = {};

export function AboutForm({ settings }: { settings: SiteSettings }) {
  const [state, action, pending] = useActionState(updateAboutAction, initial);

  return (
    <form action={action} className="admin-form">
      <label>
        Üst açıklama
        <textarea
          name="aboutIntro"
          required
          rows={3}
          defaultValue={settings.aboutIntro}
        />
      </label>

      <h3 className="admin-subtitle">1. Panel</h3>
      <label>
        Başlık
        <input
          name="aboutApproachTitle"
          required
          defaultValue={settings.aboutApproachTitle}
        />
      </label>
      <label>
        Metin
        <textarea
          name="aboutApproachText"
          required
          rows={4}
          defaultValue={settings.aboutApproachText}
        />
      </label>

      <h3 className="admin-subtitle">2. Panel</h3>
      <label>
        Başlık
        <input
          name="aboutScopeTitle"
          required
          defaultValue={settings.aboutScopeTitle}
        />
      </label>
      <label>
        Metin
        <textarea
          name="aboutScopeText"
          required
          rows={4}
          defaultValue={settings.aboutScopeText}
        />
      </label>

      <h3 className="admin-subtitle">3. Panel</h3>
      <label>
        Başlık
        <input
          name="aboutPromiseTitle"
          required
          defaultValue={settings.aboutPromiseTitle}
        />
      </label>
      <label>
        Metin
        <textarea
          name="aboutPromiseText"
          required
          rows={4}
          defaultValue={settings.aboutPromiseText}
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
