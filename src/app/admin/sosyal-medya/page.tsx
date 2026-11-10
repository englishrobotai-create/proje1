import { redirect } from "next/navigation";
import { SocialMediaForm } from "@/components/admin/SocialMediaForm";
import { getSession } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";

export default async function AdminSocialPage() {
  const session = await getSession();
  if (!session) redirect("/admin/giris");

  const settings = await getSiteSettings();

  return (
    <>
      <div className="admin-top">
        <h2>Sosyal Medya</h2>
      </div>
      <div className="admin-panel" style={{ maxWidth: 760 }}>
        <SocialMediaForm settings={settings} />
      </div>
    </>
  );
}
