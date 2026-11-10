import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/admin/giris");

  const [postCount, messageCount, unreadCount, settings] = await Promise.all([
    prisma.post.count(),
    prisma.message.count(),
    prisma.message.count({ where: { read: false } }),
    getSiteSettings(),
  ]);

  return (
    <>
      <div className="admin-top">
        <h2>Özet</h2>
        <Link href="/admin/blog/yeni" className="btn btn-primary">
          Yeni Yazı
        </Link>
      </div>
      <div className="stats">
        <div className="admin-panel stat-card">
          <span>Site başlığı</span>
          <strong style={{ fontSize: "1.15rem" }}>{settings.siteTitle}</strong>
        </div>
        <div className="admin-panel stat-card">
          <span>Blog yazısı</span>
          <strong>{postCount}</strong>
        </div>
        <div className="admin-panel stat-card">
          <span>Okunmamış mesaj</span>
          <strong>
            {unreadCount}/{messageCount}
          </strong>
        </div>
      </div>
      <div className="admin-panel">
        <p style={{ margin: 0, color: "var(--ink-soft)" }}>
          Soldaki menüden blog yazılarını, site başlığını, sosyal medya
          bağlantılarını yönetebilir ve iletişim formundan gelen mesajları
          inceleyebilirsiniz.
        </p>
      </div>
    </>
  );
}
