"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  sendContactAction,
  type ContactState,
} from "@/app/actions/messages";
import {
  CONTACT_CHANNELS,
  CONTACT_TIMES,
  GENERAL_SUBJECT,
} from "@/lib/contact-options";

const initial: ContactState = {};

export function ContactForm({ services }: { services: string[] }) {
  const [state, action, pending] = useActionState(sendContactAction, initial);

  return (
    <form action={action} className="contact-form">
      {/* Bal küpü: insanlara görünmez, botlar doldurur. */}
      <div className="hp-field" aria-hidden="true">
        <label>
          Web sitesi
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
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
          <input name="phone" type="tel" maxLength={30} placeholder="05xx xxx xx xx" />
        </label>
        <label>
          İlgilendiğiniz konu
          <select name="subject" defaultValue={GENERAL_SUBJECT}>
            <option value={GENERAL_SUBJECT}>{GENERAL_SUBJECT}</option>
            {services.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-row">
        <label>
          Nasıl ulaşalım?
          <select name="channel" defaultValue={CONTACT_CHANNELS[0]}>
            {CONTACT_CHANNELS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          Uygun olduğunuz zaman
          <select name="time" defaultValue={CONTACT_TIMES[0]}>
            {CONTACT_TIMES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
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
      <p className="form-note">
        Kişisel verileriniz,{" "}
        <Link href="/kvkk" target="_blank" rel="noopener">
          KVKK Aydınlatma Metni
        </Link>
        &apos;nde açıklandığı şekilde işlenir.
      </p>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Gönderiliyor..." : "Görüşme Talep Et"}
      </button>
    </form>
  );
}
