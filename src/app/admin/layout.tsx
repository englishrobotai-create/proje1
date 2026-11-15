import type { Metadata } from "next";
import "./admin.css";
import { logoutAction } from "@/app/actions/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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
        <AdminNav userName={session.name} logoutAction={logoutAction} />
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
