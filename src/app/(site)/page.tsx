import Link from "next/link";
import { MaliGelismelerSlider } from "@/components/MaliGelismelerSlider";
import { calculatorLinks } from "@/data/calculators";
import { prisma } from "@/lib/db";
import { fetchExternalNews } from "@/lib/external-news";
import { getSiteSettings } from "@/lib/settings";

export const revalidate = 1800;

const homeServices = [
  {
    title: "Muhasebe ve defter",
    text: "Günlük evrak, e-defter ve dönem sonu kapanışları.",
  },
  {
    title: "Vergi danışmanlığı",
    text: "KDV, stopaj, kurumlar ve gelir vergisi planlaması.",
  },
  {
    title: "Bordro ve SGK",
    text: "Personel bordrosu ve bildirge süreçlerinin yönetimi.",
  },
  {
    title: "Şirket kuruluşu",
    text: "Doğru şirket türü, kuruluş evrakları ve ilk dönem kurulum.",
  },
];

export default async function HomePage() {
  const settings = await getSiteSettings();
  const [posts, externalNews] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    fetchExternalNews(settings.externalNewsUrl, 20),
  ]);

  return (
    <>
      <section className="mg-wrap">
        <MaliGelismelerSlider items={externalNews} />
      </section>

      <section className="hero">
        <div className="hero-orb hero-orb-a" aria-hidden="true" />
        <div className="hero-orb hero-orb-b" aria-hidden="true" />
        <div className="container hero-shell">
          <div className="hero-content">
            <p className="hero-brand">{settings.siteTitle}</p>
            <h1 className="hero-title">
              Vergi ve muhasebede net, güvenilir rehberlik
            </h1>
            <p className="hero-text">
              Şirketinizin yükümlülüklerini zamanında yönetir, kararlarınızı
              mali görünürlükle güçlendiririz.
            </p>
            <div className="hero-actions">
              <Link href="/iletisim" className="btn btn-primary">
                Ücretsiz Ön Görüşme
              </Link>
              <Link href="/hizmetler" className="btn btn-ghost">
                Hizmetleri İncele
              </Link>
            </div>
          </div>
          <div className="hero-panel" aria-hidden="true">
            <div className="hero-panel-glow" />
            <div className="metric-card metric-a">
              <span>Beyan takibi</span>
              <strong>Zamanında</strong>
            </div>
            <div className="metric-card metric-b">
              <span>Raporlama</span>
              <strong>Şeffaf</strong>
            </div>
            <div className="metric-card metric-c">
              <span>Danışmanlık</span>
              <strong>Kurumsal</strong>
            </div>
            <svg className="hero-chart" viewBox="0 0 320 180" fill="none">
              <path
                d="M20 140 C70 130, 90 90, 130 95 S190 130, 230 70 S280 40, 300 35"
                stroke="rgba(196,163,90,0.9)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M20 150 C80 145, 110 120, 150 118 S210 140, 250 100 S290 80, 300 78"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="300" cy="35" r="5" fill="#c4a35a" />
            </svg>
          </div>
        </div>
      </section>

      <section className="section band-section">
        <div className="container trust-band">
          <div>
            <p className="section-kicker">Güven odaklı</p>
            <h2 className="section-title">Kurumsal disiplin, sade iletişim</h2>
          </div>
          <p className="section-lead">
            Standart süreçlerimizle beyan, bordro ve danışmanlık işlerinizi tek
            çatı altında takip ederiz.
          </p>
        </div>
        <div className="container feature-grid">
          <article className="feature-item reveal">
            <div className="feature-icon">01</div>
            <h3>Zamanında beyan</h3>
            <p>
              Vergi takvimini kaçırmadan yönetir, riskleri erken görünür
              kılarız.
            </p>
          </article>
          <article className="feature-item reveal delay-1">
            <div className="feature-icon">02</div>
            <h3>Şeffaf raporlama</h3>
            <p>
              Dönemsel özetlerle nakit akışı ve yükümlülüklerinizi net takip
              edersiniz.
            </p>
          </article>
          <article className="feature-item reveal delay-2">
            <div className="feature-icon">03</div>
            <h3>Büyüme odaklı danışmanlık</h3>
            <p>
              Kuruluştan ölçeklenmeye kadar doğru yapılandırma için
              yanınızdayız.
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="section-kicker">Hizmetler</p>
              <h2 className="section-title">Neler yapıyoruz</h2>
            </div>
            <Link href="/hizmetler" className="btn btn-secondary">
              Tüm hizmetler
            </Link>
          </div>
          <div className="service-grid home-services">
            {homeServices.map((service) => (
              <article key={service.title} className="service-item">
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section band-section" id="hesaplamalar">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="section-kicker">Hesaplama araçları</p>
              <h2 className="section-title">Pratik mali hesaplamalar</h2>
              <p className="section-lead">
                Bordro, kıdem, IFRS ve vergi hesaplamalarına hızlı erişim.
              </p>
            </div>
            <a
              href="https://www.ozcankutlu.com/tr"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Tüm araçlar
            </a>
          </div>

          <div className="calculator-grid">
            {calculatorLinks.map((tool) => (
              <a
                key={tool.href}
                href={tool.href}
                target="_blank"
                rel="noopener noreferrer"
                className="calculator-card"
              >
                <strong>{tool.title}</strong>
                <span>{tool.description}</span>
                <em>Hesaplamaya git →</em>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="section band-section">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="section-kicker">Blog</p>
              <h2 className="section-title">Ofis yazılarımız</h2>
              <p className="section-lead">
                Bu sitede yayınlanan yerel blog içerikleri.
              </p>
            </div>
            <Link href="/blog" className="btn btn-secondary">
              Tüm yazılar
            </Link>
          </div>
          <div className="post-grid">
            {posts.length === 0 ? (
              <article className="post-item">
                <h3>Henüz yazı yok</h3>
                <p>Admin panelinden ilk blog yazınızı ekleyebilirsiniz.</p>
              </article>
            ) : (
              posts.map((post) => (
                <article key={post.id} className="post-item">
                  <span className="post-meta">
                    {post.createdAt.toLocaleDateString("tr-TR")}
                  </span>
                  <h3>
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p>{post.excerpt}</p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}
