import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getSession } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/admin/giris");

  const settings = await getSiteSettings();

  return (
    <>
      <div className="admin-top">
        <h2>Site Ayarları</h2>
      </div>
      <div className="admin-panel" style={{ maxWidth: 760 }}>
        <SettingsForm settings={settings} />
      </div>
    </>
  );
}
