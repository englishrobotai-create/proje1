import { redirect } from "next/navigation";
import { PostForm } from "@/components/admin/PostForm";
import { getSession } from "@/lib/auth";
import { getLatestAuthorName } from "@/lib/posts";

export default async function NewPostPage() {
  const session = await getSession();
  if (!session) redirect("/admin/giris");

  const suggestedAuthor = await getLatestAuthorName();

  return (
    <>
      <div className="admin-top">
        <h2>Yeni Blog Yazısı</h2>
      </div>
      <div className="admin-panel" style={{ maxWidth: 760 }}>
        <PostForm mode="create" suggestedAuthor={suggestedAuthor} />
      </div>
    </>
  );
}
