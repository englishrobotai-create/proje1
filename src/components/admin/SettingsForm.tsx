"use client";

import { useActionState, useState } from "react";
import {
  updateSettingsAction,
  type SettingsState,
} from "@/app/actions/settings";
import type { SiteSettings } from "@/lib/settings";
import {
  TITLE_FONTS,
  TITLE_PREVIEW_BASE_PX,
  TITLE_SCALE_DEFAULT,
  TITLE_SCALE_MAX,
  TITLE_SCALE_MIN,
  TITLE_SCALE_STEP,
  titleFontStack,
} from "@/lib/title-fonts";

const initial: SettingsState = {};

// Alt bilgideki başlık üst menüdekinden biraz küçük çizilir (bkz. showcase.css).
const FOOTER_PREVIEW_BASE_PX = 26;

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, action, pending] = useActionState(
    updateSettingsAction,
    initial,
  );
  const [title, setTitle] = useState(settings.siteTitle);
  const [font, setFont] = useState(settings.titleFont);
  const [scale, setScale] = useState(settings.titleScale);

  const previewFamily = titleFontStack(font);
  const previewTitle = title.trim() || "Site başlığı";

  return (
    <form action={action} className="admin-form">
      <label>
        Site başlığı
        <input
          name="siteTitle"
          required
          minLength={2}
          maxLength={80}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <p className="form-hint">
        Bu başlık sitenin logosunda, sekme başlığında ve alt bilgide görünür.
      </p>

      <h3 className="admin-subtitle">Başlığın yazı tipi ve boyutu</h3>
      <p className="form-hint">
        Üst menüdeki ve sayfa altındaki ofis adının görünümünü buradan seçin.
        Kaydettiğinizde her iki yerde de aynı anda değişir.
      </p>
      <div className="form-row">
        <label>
          Yazı tipi
          <select
            name="titleFont"
            value={font}
            onChange={(event) => setFont(event.target.value)}
          >
            {TITLE_FONTS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Boyut: %{scale}
          {scale === TITLE_SCALE_DEFAULT ? " (varsayılan)" : ""}
          <input
            name="titleScale"
            type="range"
            min={TITLE_SCALE_MIN}
            max={TITLE_SCALE_MAX}
            step={TITLE_SCALE_STEP}
            value={scale}
            onChange={(event) => setScale(Number(event.target.value))}
          />
        </label>
      </div>
      <div>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={font === "" && scale === TITLE_SCALE_DEFAULT}
          onClick={() => {
            setFont("");
            setScale(TITLE_SCALE_DEFAULT);
          }}
        >
          Varsayılana dön
        </button>
      </div>
      <p className="title-preview-label">Önizleme: üst menü</p>
      <div className="title-preview title-preview-light" aria-hidden="true">
        <span
          style={{
            fontFamily: previewFamily,
            fontSize: `${(TITLE_PREVIEW_BASE_PX * scale) / 100}px`,
            fontWeight: 600,
          }}
        >
          {previewTitle}
        </span>
      </div>
      <p className="title-preview-label">Önizleme: sayfa altı</p>
      <div className="title-preview title-preview-dark" aria-hidden="true">
        <span
          style={{
            fontFamily: previewFamily,
            fontSize: `${(FOOTER_PREVIEW_BASE_PX * scale) / 100}px`,
            fontWeight: 500,
          }}
        >
          {previewTitle}
        </span>
      </div>
      <p className="form-hint">
        Önizleme yaklaşıktır; gerçek boyut ekran genişliğine göre küçülüp
        büyür. Başlık çok uzunsa büyük boyutlarda iki satıra bölünür.
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
