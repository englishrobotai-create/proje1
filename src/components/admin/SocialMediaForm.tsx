"use client";

import { useActionState, useState } from "react";
import {
  updateSettingsAction,
  type SettingsState,
} from "@/app/actions/settings";
import type { SiteSettings } from "@/lib/settings";

const initial: SettingsState = {};

const platforms = [
  {
    key: "facebook",
    label: "Facebook",
    placeholder: "https://facebook.com/hesabiniz",
  },
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/hesabiniz",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    placeholder: "https://linkedin.com/company/hesabiniz",
  },
  {
    key: "twitter",
    label: "X (Twitter)",
    placeholder: "https://x.com/hesabiniz",
  },
  {
    key: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@hesabiniz",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    placeholder: "https://wa.me/905xxxxxxxxx",
  },
] as const;

type PlatformKey = (typeof platforms)[number]["key"];

export function SocialMediaForm({ settings }: { settings: SiteSettings }) {
  const [state, action, pending] = useActionState(
    updateSettingsAction,
    initial,
  );

  const [enabled, setEnabled] = useState<Record<PlatformKey, boolean>>({
    facebook: Boolean(settings.facebook),
    instagram: Boolean(settings.instagram),
    linkedin: Boolean(settings.linkedin),
    twitter: Boolean(settings.twitter),
    youtube: Boolean(settings.youtube),
    whatsapp: Boolean(settings.whatsapp),
  });

  const [urls, setUrls] = useState<Record<PlatformKey, string>>({
    facebook: settings.facebook,
    instagram: settings.instagram,
    linkedin: settings.linkedin,
    twitter: settings.twitter,
    youtube: settings.youtube,
    whatsapp: settings.whatsapp,
  });

  const visibleCount = platforms.filter((p) => enabled[p.key] && urls[p.key].trim()).length;

  return (
    <form action={action} className="admin-form">
      {/* Preserve other settings */}
      <input type="hidden" name="siteTitle" value={settings.siteTitle} />
      <input type="hidden" name="externalNewsUrl" value={settings.externalNewsUrl} />
      <input type="hidden" name="externalNewsLabel" value={settings.externalNewsLabel} />

      <p className="form-hint" style={{ marginTop: 0 }}>
        Açık olan platformlar footer’da ikon olarak görünür. Kapalı olanlar
        gizlenir. Şu an görünen: <strong>{visibleCount}</strong>
      </p>

      <div className="social-admin-list">
        {platforms.map((platform) => (
          <div key={platform.key} className="social-admin-item">
            <label className="social-admin-toggle">
              <input
                type="checkbox"
                checked={enabled[platform.key]}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setEnabled((prev) => ({ ...prev, [platform.key]: checked }));
                  if (!checked) {
                    setUrls((prev) => ({ ...prev, [platform.key]: "" }));
                  }
                }}
              />
              <span>{platform.label}</span>
              <em>{enabled[platform.key] ? "Görünür" : "Gizli"}</em>
            </label>

            <input
              name={platform.key}
              type="url"
              placeholder={platform.placeholder}
              disabled={!enabled[platform.key]}
              value={enabled[platform.key] ? urls[platform.key] : ""}
              onChange={(event) =>
                setUrls((prev) => ({
                  ...prev,
                  [platform.key]: event.target.value,
                }))
              }
            />
          </div>
        ))}
      </div>

      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Kaydediliyor..." : "Sosyal Medyayı Kaydet"}
      </button>
    </form>
  );
}
