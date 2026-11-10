import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Hizmetler",
};

const services = [
  {
    title: "Muhasebe ve defter tutma",
    text: "Günlük evrak takibi, e-defter/e-fatura süreçleri ve dönem sonu kapanışları.",
    no: "01",
  },
  {
    title: "Vergi danışmanlığı",
    text: "KDV, stopaj, kurumlar ve gelir vergisi planlaması ile beyan yönetimi.",
    no: "02",
  },
  {
    title: "Bordro ve SGK",
    text: "Personel bordrosu, bildirge ve işe giriş-çıkış işlemlerinin düzenli yürütülmesi.",
    no: "03",
  },
  {
    title: "Şirket kuruluşu",
    text: "Doğru şirket türü seçimi, kuruluş evrakları ve ilk dönem muhasebe kurulumu.",
    no: "04",
  },
  {
    title: "Mali analiz",
    text: "Dönemsel özetler, nakit akışı görünümü ve yönetim kararları için sade raporlar.",
    no: "05",
  },
  {
    title: "Denetim hazırlığı",
    text: "Kontroller öncesi belge düzeni, risk taraması ve süreç iyileştirme önerileri.",
    no: "06",
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHero
        kicker="Hizmet portföyü"
        title="Hizmetler"
        description="Standart hizmet paketimiz, mali müşavirlik ofisinizin temel ihtiyaçlarını kapsayacak şekilde hazırlanmıştır."
      />
      <section className="section">
        <div className="container service-grid">
          {services.map((service) => (
            <article key={service.title} className="service-item">
              <div className="feature-icon">{service.no}</div>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
