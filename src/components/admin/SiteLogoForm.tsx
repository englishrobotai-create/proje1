"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import {
  removeSiteLogoAction,
  updateSiteLogoAction,
  type SettingsState,
} from "@/app/actions/settings";
import { ConfirmButton } from "@/components/portal/ConfirmButton";

const initial: SettingsState = {};

type Props = {
  hasUpload: boolean;
  version: number;
  defaultSrc: string;
  maxMb: number;
};

export function SiteLogoForm({
  hasUpload,
  version,
  defaultSrc,
  maxMb,
}: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);

  function setLocalPreview(url: string | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = url;
    setPreview(url);
  }

  const [state, action, pending] = useActionState(
    async (prev: SettingsState, formData: FormData) => {
      const result = await updateSiteLogoAction(prev, formData);
      if (result.success) setLocalPreview(null);
      return result;
    },
    initial,
  );
  const [removeState, removeAction] = useActionState(
    async (prev: SettingsState) => {
      const result = await removeSiteLogoAction(prev);
      if (result.success) setLocalPreview(null);
      return result;
    },
    initial,
  );

  const currentSrc = hasUpload ? `/admin/logo?v=${version}` : defaultSrc;

  return (
    <div className="photo-admin logo-admin">
      <form action={action} className="admin-form">
        <div className="photo-admin-row">
          <div className="photo-admin-preview logo-admin-preview">
            <Image
              src={preview ?? currentSrc}
              alt="Site logosu önizlemesi"
              fill
              sizes="96px"
              unoptimized
              className="photo-admin-img logo-admin-img"
            />
          </div>

          <div className="photo-admin-fields">
            <label>
              {hasUpload ? "Logoyu değiştir" : "Logo yükleyin"}
              <input
                type="file"
                name="logo"
                accept="image/jpeg,image/png,image/webp"
                required={!hasUpload}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  setLocalPreview(file ? URL.createObjectURL(file) : null);
                }}
              />
            </label>

            <p className="form-hint">
              JPG, PNG veya WebP · en fazla {maxMb} MB · kare veya yatay logo
              en iyi sonucu verir. Üst menüde ve sayfa altında görünür.
              {hasUpload
                ? " Şu an yüklediğiniz logo kullanılıyor."
                : " Şu an varsayılan logo gösteriliyor."}
            </p>
          </div>
        </div>

        {state.error ? <p className="form-error">{state.error}</p> : null}
        {state.success ? <p className="form-success">{state.success}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Kaydediliyor..." : "Logoyu kaydet"}
        </button>
      </form>

      {hasUpload ? (
        <form action={removeAction} className="photo-admin-remove">
          <ConfirmButton
            message="Yüklediğiniz logo silinecek ve varsayılan logoya dönülecek. Bu işlem geri alınamaz. Devam edilsin mi?"
            className="btn btn-secondary"
          >
            Logoyu sil (varsayılana dön)
          </ConfirmButton>
          {removeState.error ? (
            <p className="form-error">{removeState.error}</p>
          ) : null}
          {removeState.success ? (
            <p className="form-success">{removeState.success}</p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
