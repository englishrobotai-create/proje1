"use client";

import { useActionState } from "react";
import {
  sendContactAction,
  type ContactState,
} from "@/app/actions/messages";

const initial: ContactState = {};

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactAction, initial);

  return (
    <form action={action} className="contact-form">
      <div className="form-row">
        <label>
          Ad Soyad
          <input name="name" required maxLength={80} placeholder="Adınız Soyadınız" />
        </label>
        <label>
          E-posta
          <input
            name="email"
            type="email"
            required
            maxLength={120}
            placeholder="ornek@mail.com"
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          Telefon
          <input name="phone" maxLength={30} placeholder="05xx xxx xx xx" />
        </label>
        <label>
          Konu
          <input name="subject" maxLength={120} placeholder="Görüşmek istediğiniz konu" />
        </label>
      </div>
      <label>
        Mesaj
        <textarea
          name="body"
          required
          rows={6}
          maxLength={2000}
          placeholder="Kısaca ihtiyacınızı yazın"
        />
      </label>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Gönderiliyor..." : "Mesaj Gönder"}
      </button>
    </form>
  );
}
