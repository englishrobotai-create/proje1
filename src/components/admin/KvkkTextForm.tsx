"use client";

import { useActionState, useState } from "react";
import {
  resetKvkkTextAction,
  updateKvkkTextAction,
  type PageState,
} from "@/app/actions/pages";
import { KVKK_CUSTOM_TEXT_MAX } from "@/lib/kvkk-fields";

const initial: PageState = {};

export function KvkkTextForm({
  initialText,
  isCustom,
}: {
  initialText: string;
  isCustom: boolean;
}) {
  const [state, action, pending] = useActionState(updateKvkkTextAction, initial);
  const [resetState, resetAction, resetPending] = useActionState(
    resetKvkkTextAction,
    initial,
  );
  // İki form ayrı durum tutar; eski mesaj yeni işlemin yanında kalmasın diye
  // yalnızca en son çalıştırılan işlemin mesajı gösterilir.
  const [last, setLast] = useState<"save" | "reset" | null>(null);
  const showSave = last === "save";
  const showReset = last === "reset";

  return (
    <>
      {/* key: şablon alanları değişince editör yeni metinle yeniden kurulur. */}
      <form
        action={action}
        className="admin-form"
        key={initialText}
        onSubmit={() => setLast("save")}
      >
        <label>
          Metnin tamamı
          <textarea
            name="customText"
            rows={28}
            maxLength={KVKK_CUSTOM_TEXT_MAX}
            defaultValue={initialText}
            spellCheck
          />
        </label>
        <p className="form-hint">
          Biçim: boş satır yeni paragraf açar; <strong>## </strong> ile başlayan
          satır başlık olur; <strong>- </strong> ile başlayan ardışık satırlar
          madde işaretli liste olur. Bağlantı ve renk gibi biçimler desteklenmez.
        </p>
        {showSave && state.error ? (
          <p className="form-error">{state.error}</p>
        ) : null}
        {showSave && state.success ? (
          <p className="form-success">{state.success}</p>
        ) : null}
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Kaydediliyor..." : "Metni Kaydet"}
        </button>
      </form>

      {/* Mesajlar formun dışında: şablona dönülünce form kalksa da görünür kalır. */}
      {showReset && resetState.error ? (
        <p className="form-error">{resetState.error}</p>
      ) : null}
      {showReset && resetState.success ? (
        <p className="form-success">{resetState.success}</p>
      ) : null}
      {isCustom ? (
        <form
          action={resetAction}
          className="admin-form"
          style={{ marginTop: "1rem" }}
          onSubmit={() => setLast("reset")}
        >
          <p className="form-hint" style={{ margin: 0 }}>
            Yazdığınız metni silip hazır şablona dönmek için:
          </p>
          <button
            type="submit"
            className="btn btn-secondary"
            disabled={resetPending}
          >
            {resetPending ? "Dönülüyor..." : "Şablona Dön"}
          </button>
        </form>
      ) : null}
    </>
  );
}
