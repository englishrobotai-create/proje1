import { redirect } from "next/navigation";
import { AboutForm } from "@/components/admin/AboutForm";
import { getSession } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";

export default async function AdminAboutPage() {
  const session = await getSession();
  if (!session) redirect("/admin/giris");

  const settings = await getSiteSettings();

  return (
    <>
      <div className="admin-top">
        <h2>Hakkımda Sayfası</h2>
      </div>
      <div className="admin-panel" style={{ maxWidth: 760 }}>
        <AboutForm settings={settings} />
      </div>
    </>
  );
}
