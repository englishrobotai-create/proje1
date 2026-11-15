import type { Metadata } from "next";
import { PostCard } from "@/components/Cards";
import { IconBook } from "@/components/Icons";
import { PageHero } from "@/components/PageHero";
import { formatPostDate, listPublishedPosts, publishDate } from "@/lib/posts";
import { pageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return pageMetadata(settings, {
    title: "Blog",
    description:
      "Vergi, muhasebe ve işletme yönetimi üzerine güncel yazılar.",
    path: "/blog",
    feed: true,
  });
}

export default async function BlogPage() {
  const posts = await listPublishedPosts();

  return (
    <>
      <PageHero
        title="Blog"
        description="Vergi, muhasebe ve işletme yönetimi üzerine güncel yazılar."
        icon={IconBook}
      />
      <section className="section">
        <div className="container sc-grid sc-grid-3">
          {posts.length === 0 ? (
            <article className="sc-card tone-blue" data-reveal>
              <h3>Yayında yazı bulunmuyor</h3>
              <p>Yeni içerikler yakında eklenecek.</p>
            </article>
          ) : (
            posts.map((post, index) => {
              const date = publishDate(post);
              return (
                <PostCard
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  title={post.title}
                  excerpt={post.excerpt}
                  dateISO={date.toISOString()}
                  dateLabel={formatPostDate(date)}
                  index={index}
                />
              );
            })
          )}
        </div>
      </section>
    </>
  );
}
