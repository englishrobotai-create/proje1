import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLaunchChecklist } from "@/lib/launch-checklist";
import { getSiteSettings } from "@/lib/settings";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/admin/giris");

  const [postCount, messageCount, unreadCount, recentMessages, settings] =
    await Promise.all([
      prisma.post.count(),
      prisma.message.count(),
      prisma.message.count({ where: { read: false } }),
      prisma.message.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
      getSiteSettings(),
    ]);

  const checklist = await getLaunchChecklist(settings);
  const open = checklist.filter((item) => !item.done);
  const required = open.filter((item) => !item.optional);
  const suggestions = open.filter((item) => item.optional);
  const done = checklist.filter((item) => item.done);

  let summary = "Her şey hazır görünüyor.";
  if (required.length > 0) {
    summary = `Yayına almadan önce ${required.length} madde kaldı${
      suggestions.length > 0 ? `, ${suggestions.length} öneri var` : ""
    }.`;
  } else if (suggestions.length > 0) {
    summary = `Gerekli madde kalmadı; ${suggestions.length} öneri var.`;
  }

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
          <strong>{unreadCount}</strong>
          <small>Toplam {messageCount} mesaj</small>
        </div>
      </div>

      <section className="admin-panel" aria-labelledby="launch-title">
        <div className="launch-head">
          <h3 id="launch-title">Canlıya hazırlık</h3>
          <p>{summary}</p>
        </div>
        {open.length > 0 ? (
          <ul className="launch-list">
            {[...required, ...suggestions].map((item) => (
              <li
                key={item.id}
                className={`launch-item ${item.optional ? "is-optional" : "is-required"}`}
              >
                <div>
                  <strong>{item.title}</strong>
                  <span className="launch-tag">
                    {item.optional ? "Öneri" : "Gerekli"}
                  </span>
                  <p>{item.detail}</p>
                </div>
                {item.href ? (
                  <Link href={item.href} className="btn btn-secondary">
                    Düzelt
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
        {done.length > 0 ? (
          <p className="launch-done">
            ✓ Tamam: {done.map((item) => item.title).join(", ")}
          </p>
        ) : null}
      </section>

      <section className="admin-panel" aria-labelledby="recent-title">
        <div className="launch-head">
          <h3 id="recent-title">Son mesajlar</h3>
          <Link href="/admin/mesajlar">Tüm mesajlar</Link>
        </div>
        {recentMessages.length === 0 ? (
          <p style={{ margin: 0, color: "var(--ink-soft)" }}>Henüz mesaj yok.</p>
        ) : (
          <ul className="recent-messages">
            {recentMessages.map((message) => (
              <li key={message.id}>
                <span>
                  {!message.read ? (
                    <span className="recent-dot" title="Okunmadı" />
                  ) : null}
                  <strong>{message.name}</strong>
                  {" · "}
                  {(message.subject || message.body).slice(0, 80)}
                </span>
                <small>{message.createdAt.toLocaleDateString("tr-TR")}</small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
