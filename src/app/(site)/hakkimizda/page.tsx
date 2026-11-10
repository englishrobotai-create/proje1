import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Hakkımızda",
};

export default async function AboutPage() {
  const { siteTitle } = await getSiteSettings();

  return (
    <>
      <PageHero
        kicker="Kurumsal profil"
        title="Hakkımızda"
        description={`${siteTitle}, işletmelerin vergi ve muhasebe süreçlerini düzenli, anlaşılır ve denetlenebilir şekilde yönetmesi için kurulmuş bir mali müşavirlik ofisidir.`}
      />

      <section className="section">
        <div className="container about-layout">
          <article className="about-panel">
            <p className="section-kicker">Yaklaşım</p>
            <h2>Çalışma yaklaşımımız</h2>
            <p>
              Her müşteriye aynı standart kaliteyi sunarız: net iletişim,
              zamanında teslim ve belgelenmiş süreçler. Amacımız yalnızca
              beyanları tamamlamak değil, işletmenizin mali kararlarını daha
              sağlam temellere oturtmaktır.
            </p>
          </article>
          <article className="about-panel">
            <p className="section-kicker">Kapsam</p>
            <h2>Kimlerle çalışıyoruz</h2>
            <p>
              Limited şirketler, anonim şirketler, şahıs işletmeleri ve serbest
              meslek sahipleriyle çalışıyoruz. Sektör fark etmeksizin ortak
              ihtiyacınız düzen ve güvenilir danışmanlıktır.
            </p>
          </article>
          <article className="about-panel accent">
            <p className="section-kicker">Taahhüt</p>
            <h2>Ne vaat ediyoruz</h2>
            <p>
              Kaçırılmayan tarihler, anlaşılır raporlar ve ihtiyaç anında hızlı
              dönüş. Büyürken yanınızda duran bir mali iş ortağı olmayı
              hedefleriz.
            </p>
          </article>
        </div>
      </section>
    </>
  );
}
