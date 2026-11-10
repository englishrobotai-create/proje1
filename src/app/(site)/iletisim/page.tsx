import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { PageHero } from "@/components/PageHero";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "İletişim",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <PageHero
        kicker="İletişim"
        title={settings.contactHeroTitle}
        description={settings.contactHeroText}
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
              <strong>{settings.contactEmail}</strong>
            </div>
            <div className="contact-detail">
              <span>Telefon</span>
              <strong>{settings.contactPhone}</strong>
            </div>
            <div className="contact-detail">
              <span>Adres</span>
              <strong>{settings.contactAddress}</strong>
            </div>
            <div className="contact-detail">
              <span>Çalışma saatleri</span>
              <strong>{settings.contactHours}</strong>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
