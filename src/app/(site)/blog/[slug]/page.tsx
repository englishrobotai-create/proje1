import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { prisma } from "@/lib/db";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post || !post.published) return { title: "Yazı bulunamadı" };
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });

  if (!post || !post.published) notFound();

  return (
    <>
      <PageHero
        kicker={post.createdAt.toLocaleDateString("tr-TR")}
        title={post.title}
        description={post.excerpt}
      />
      <section className="section">
        <div className="container article-shell">
          <article className="content-block article-body">
            {post.content.split("\n").map((paragraph, index) =>
              paragraph.trim() ? <p key={index}>{paragraph}</p> : null,
            )}
          </article>
          <Link href="/blog" className="btn btn-secondary">
            Tüm yazılara dön
          </Link>
        </div>
      </section>
    </>
  );
}
