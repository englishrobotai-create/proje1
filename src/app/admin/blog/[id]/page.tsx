import { notFound, redirect } from "next/navigation";
import { PostForm } from "@/components/admin/PostForm";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditPostPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/admin/giris");

  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <>
      <div className="admin-top">
        <h2>Yazıyı Düzenle</h2>
      </div>
      <div className="admin-panel" style={{ maxWidth: 760 }}>
        <PostForm
          mode="edit"
          postId={post.id}
          defaults={{
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
            published: post.published,
          }}
        />
      </div>
    </>
  );
}
