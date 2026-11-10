import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";

export default async function HomePage() {
  const { siteTitle } = await getSiteSettings();
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: 2,
  });

  return (
    <>
      <section className="hero">
        <div className="container hero-content">
          <p className="hero-brand">{siteTitle}</p>
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
            <Link href="/hizmetler" className="btn btn-secondary">
              Hizmetleri İncele
            </Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="section-kicker">Neden biz</p>
          <h2 className="section-title">Kurumsal disiplin, sade iletişim</h2>
          <p className="section-lead">
            Standart süreçlerimizle beyan, bordro ve danışmanlık işlerinizi
            tek çatı altında takip ederiz.
          </p>
          <div className="feature-grid">
            <article className="feature-item">
              <h3>Zamanında beyan</h3>
              <p>
                Vergi takvimini kaçırmadan yönetir, riskleri erken
                görünür kılarız.
              </p>
            </article>
            <article className="feature-item">
              <h3>Şeffaf raporlama</h3>
              <p>
                Dönemsel özetlerle nakit akışı ve yükümlülüklerinizi net
                takip edersiniz.
              </p>
            </article>
            <article className="feature-item">
              <h3>Büyüme odaklı danışmanlık</h3>
              <p>
                Kuruluştan ölçeklenmeye kadar doğru yapılandırma için yanınızdayız.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <p className="section-kicker">Blog</p>
          <h2 className="section-title">Güncel yazılar</h2>
          <p className="section-lead">
            Vergi ve işletme yönetimi hakkında pratik notlar.
          </p>
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
