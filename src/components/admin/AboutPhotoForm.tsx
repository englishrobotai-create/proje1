"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import {
  removeAboutPhotoAction,
  updateAboutPhotoAction,
  type PageState,
} from "@/app/actions/pages";
import { ConfirmButton } from "@/components/portal/ConfirmButton";

const initial: PageState = {};

type Props = {
  show: boolean;
  /** Yüklenmiş bir fotoğraf var mı (yoksa örnek görsel kullanılıyor). */
  hasUpload: boolean;
  version: number;
  sampleSrc: string;
  maxMb: number;
};

export function AboutPhotoForm({ show, hasUpload, version, sampleSrc, maxMb }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);

  function setLocalPreview(url: string | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = url;
    setPreview(url);
  }

  const [state, action, pending] = useActionState(
    async (prev: PageState, formData: FormData) => {
      const result = await updateAboutPhotoAction(prev, formData);
      // Kayıt başarılıysa sunucudaki görsel yeniden yüklenir; yerel önizleme gerekmez.
      if (result.success) setLocalPreview(null);
      return result;
    },
    initial,
  );
  const [removeState, removeAction] = useActionState(
    async (prev: PageState) => {
      const result = await removeAboutPhotoAction(prev);
      if (result.success) setLocalPreview(null);
      return result;
    },
    initial,
  );

  const currentSrc = hasUpload
    ? `/admin/hakkimizda/foto?v=${version}`
    : sampleSrc;

  return (
    <div className="photo-admin">
      <form action={action} className="admin-form">
        <div className="photo-admin-row">
          <div className="photo-admin-preview">
            <Image
              src={preview ?? currentSrc}
              alt="Hakkımda sayfası fotoğrafı önizlemesi"
              fill
              sizes="160px"
              unoptimized
              className="photo-admin-img"
            />
            {!show && !preview ? (
              <span className="photo-admin-badge">Sayfada gizli</span>
            ) : null}
          </div>

          <div className="photo-admin-fields">
            <label className="checkbox-row">
              <input type="checkbox" name="show" defaultChecked={show} />
              Hakkımda sayfasında göster
            </label>

            <label>
              {hasUpload ? "Fotoğrafı değiştir" : "Kendi fotoğrafınızı yükleyin"}
              <input
                type="file"
                name="photo"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  setLocalPreview(file ? URL.createObjectURL(file) : null);
                }}
              />
            </label>

            <p className="form-hint">
              JPG, PNG veya WebP · en fazla {maxMb} MB · dikey (4:5) kadraj en iyi sonucu verir.
              {hasUpload
                ? " Şu an yüklediğiniz fotoğraf kullanılıyor."
                : " Şu an örnek bir illüstrasyon gösteriliyor; kendi fotoğrafınızı yükleyince onun yerini alır."}
            </p>
          </div>
        </div>

        {state.error ? <p className="form-error">{state.error}</p> : null}
        {state.success ? <p className="form-success">{state.success}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>

      {hasUpload ? (
        <form action={removeAction} className="photo-admin-remove">
          <ConfirmButton
            message="Yüklediğiniz fotoğraf silinecek ve örnek görsele dönülecek. Bu işlem geri alınamaz. Devam edilsin mi?"
            className="btn btn-secondary"
          >
            Fotoğrafı sil (örnek görsele dön)
          </ConfirmButton>
          {removeState.error ? <p className="form-error">{removeState.error}</p> : null}
          {removeState.success ? <p className="form-success">{removeState.success}</p> : null}
        </form>
      ) : null}
    </div>
  );
}
