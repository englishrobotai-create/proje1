import Link from "next/link";
import { redirect } from "next/navigation";
import {
  deletePostAction,
  togglePostPublishedAction,
} from "@/app/actions/posts";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminBlogPage() {
  const session = await getSession();
  if (!session) redirect("/admin/giris");

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="admin-top">
        <h2>Blog Yazıları</h2>
        <Link href="/admin/blog/yeni" className="btn btn-primary">
          Yeni Yazı
        </Link>
      </div>
      <div className="admin-panel">
        {posts.length === 0 ? (
          <p style={{ margin: 0 }}>Henüz yazı yok. İlk yazınızı ekleyin.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Başlık</th>
                <th>Durum</th>
                <th>Tarih</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <strong>{post.title}</strong>
                    <div style={{ color: "#7a8795", fontSize: "0.85rem" }}>
                      /blog/{post.slug}
                    </div>
                  </td>
                  <td>{post.published ? "Yayında" : "Taslak"}</td>
                  <td>{post.createdAt.toLocaleDateString("tr-TR")}</td>
                  <td>
                    <div className="row-actions">
                      <Link
                        href={`/admin/blog/${post.id}`}
                        className="btn btn-secondary"
                        style={{ padding: "0.45rem 0.8rem" }}
                      >
                        Düzenle
                      </Link>
                      <form action={togglePostPublishedAction.bind(null, post.id)}>
                        <button
                          type="submit"
                          className="btn btn-secondary"
                          style={{ padding: "0.45rem 0.8rem" }}
                        >
                          {post.published ? "Taslağa Al" : "Yayınla"}
                        </button>
                      </form>
                      <form action={deletePostAction.bind(null, post.id)}>
                        <button
                          type="submit"
                          className="btn btn-danger"
                          style={{ padding: "0.45rem 0.8rem" }}
                        >
                          Sil
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
