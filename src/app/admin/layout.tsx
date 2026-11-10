import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { getSession } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  if (!session) {
    return children;
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <h1>Yönetim Paneli</h1>
        <nav className="admin-nav">
          <Link href="/admin">Özet</Link>
          <Link href="/admin/blog">Blog Yazıları</Link>
          <Link href="/admin/blog/yeni">Yeni Blog Yazısı</Link>
          <Link href="/admin/hizmetler">Hizmetler</Link>
          <Link href="/admin/hakkimizda">Hakkımızda</Link>
          <Link href="/admin/iletisim">İletişim</Link>
          <Link href="/admin/mesajlar">Mesajlar</Link>
          <Link href="/admin/ayarlar">Ayarlar</Link>
          <Link href="/" target="_blank">
            Siteyi Gör
          </Link>
          <form action={logoutAction}>
            <button type="submit">Çıkış Yap</button>
          </form>
        </nav>
        <p style={{ marginTop: "1.5rem", opacity: 0.7, fontSize: "0.85rem" }}>
          {session.name}
        </p>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
