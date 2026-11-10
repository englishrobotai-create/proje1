import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Blog",
};

export default async function BlogPage() {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHero
        kicker="İçerik"
        title="Blog"
        description="Vergi, muhasebe ve işletme yönetimi üzerine güncel yazılar."
      />
      <section className="section">
        <div className="container post-grid">
          {posts.length === 0 ? (
            <article className="post-item">
              <h3>Yayında yazı bulunmuyor</h3>
              <p>Yeni içerikler yakında eklenecek.</p>
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
                <Link href={`/blog/${post.slug}`} className="text-link">
                  Yazıyı oku →
                </Link>
              </article>
            ))
          )}
        </div>
      </section>
    </>
  );
}
