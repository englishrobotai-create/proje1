import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "İletişim",
};

export default async function ContactPage() {
  const { siteTitle } = await getSiteSettings();

  return (
    <div className="container page-hero">
      <h1>İletişim</h1>
      <p>
        {siteTitle} ile görüşmek için formu doldurun. Mesajlarınız yönetim
        paneline düşer.
      </p>
      <div className="contact-layout">
        <div className="info-panel">
          <ContactForm />
        </div>
        <aside className="info-panel">
          <h3 style={{ marginTop: 0, fontFamily: "var(--font-display), serif" }}>
            Ofis bilgileri
          </h3>
          <p>E-posta: info@ornek-mm.com</p>
          <p style={{ marginTop: "0.6rem" }}>Telefon: +90 (212) 000 00 00</p>
          <p style={{ marginTop: "0.6rem" }}>Adres: İstanbul, Türkiye</p>
          <p style={{ marginTop: "1rem" }}>
            Çalışma saatleri: Hafta içi 09:00 – 18:00
          </p>
        </aside>
      </div>
    </div>
  );
}
