import { redirect } from "next/navigation";
import { PostForm } from "@/components/admin/PostForm";
import { getSession } from "@/lib/auth";

export default async function NewPostPage() {
  const session = await getSession();
  if (!session) redirect("/admin/giris");

  return (
    <>
      <div className="admin-top">
        <h2>Yeni Blog Yazısı</h2>
      </div>
      <div className="admin-panel" style={{ maxWidth: 760 }}>
        <PostForm mode="create" />
      </div>
    </>
  );
}
