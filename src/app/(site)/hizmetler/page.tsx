import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hizmetler",
};

const services = [
  {
    title: "Muhasebe ve defter tutma",
    text: "Günlük evrak takibi, e-defter/e-fatura süreçleri ve dönem sonu kapanışları.",
  },
  {
    title: "Vergi danışmanlığı",
    text: "KDV, stopaj, kurumlar ve gelir vergisi planlaması ile beyan yönetimi.",
  },
  {
    title: "Bordro ve SGK",
    text: "Personel bordrosu, bildirge ve işe giriş-çıkış işlemlerinin düzenli yürütülmesi.",
  },
  {
    title: "Şirket kuruluşu",
    text: "Doğru şirket türü seçimi, kuruluş evrakları ve ilk dönem muhasebe kurulumu.",
  },
  {
    title: "Mali analiz",
    text: "Dönemsel özetler, nakit akışı görünümü ve yönetim kararları için sade raporlar.",
  },
  {
    title: "Denetim hazırlığı",
    text: "Kontroller öncesi belge düzeni, risk taraması ve süreç iyileştirme önerileri.",
  },
];

export default function ServicesPage() {
  return (
    <div className="container page-hero">
      <h1>Hizmetler</h1>
      <p>
        Standart hizmet paketimiz, mali müşavirlik ofisinizin temel ihtiyaçlarını
        kapsayacak şekilde hazırlanmıştır.
      </p>
      <div className="service-grid" style={{ marginTop: "2rem" }}>
        {services.map((service) => (
          <article key={service.title} className="service-item">
            <h3>{service.title}</h3>
            <p>{service.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
