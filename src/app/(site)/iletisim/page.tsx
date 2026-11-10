import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { PageHero } from "@/components/PageHero";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "İletişim",
};

export default async function ContactPage() {
  const { siteTitle } = await getSiteSettings();

  return (
    <>
      <PageHero
        kicker="İletişim"
        title="Birlikte planlayalım"
        description={`${siteTitle} ile görüşmek için formu doldurun. Mesajlarınız yönetim paneline düşer.`}
      />
      <section className="section">
        <div className="container contact-layout">
          <div className="info-panel contact-form-panel">
            <h2 className="panel-title">Mesaj gönderin</h2>
            <ContactForm />
          </div>
          <aside className="info-panel contact-aside">
            <h2 className="panel-title">Ofis bilgileri</h2>
            <div className="contact-detail">
              <span>E-posta</span>
              <strong>info@ornek-mm.com</strong>
            </div>
            <div className="contact-detail">
              <span>Telefon</span>
              <strong>+90 (212) 000 00 00</strong>
            </div>
            <div className="contact-detail">
              <span>Adres</span>
              <strong>İstanbul, Türkiye</strong>
            </div>
            <div className="contact-detail">
              <span>Çalışma saatleri</span>
              <strong>Hafta içi 09:00 – 18:00</strong>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
