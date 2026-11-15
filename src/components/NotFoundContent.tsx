import Link from "next/link";
import { PageHero } from "@/components/PageHero";

/** 404 sayfasının ortak içeriği (başlık bandı + yönlendirme düğmeleri). */
export function NotFoundContent() {
  return (
    <>
      <PageHero
        kicker="404"
        title="Sayfa bulunamadı"
        description="Aradığınız sayfa taşınmış, kaldırılmış ya da adres yanlış yazılmış olabilir."
      />
      <section className="section">
        <div className="container">
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <Link href="/" className="btn btn-primary">
              Ana sayfaya dön
            </Link>
            <Link href="/hizmetler" className="btn btn-secondary">
              Hizmetler
            </Link>
            <Link href="/iletisim" className="btn btn-secondary">
              İletişim
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
