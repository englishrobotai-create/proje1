import { redirect } from "next/navigation";
import { ContactFormAdmin } from "@/components/admin/ContactFormAdmin";
import { getSession } from "@/lib/auth";
import { getSiteSettings } from "@/lib/settings";

export default async function AdminContactPage() {
  const session = await getSession();
  if (!session) redirect("/admin/giris");

  const settings = await getSiteSettings();

  return (
    <>
      <div className="admin-top">
        <h2>İletişim Sayfası</h2>
      </div>
      <div className="admin-panel" style={{ maxWidth: 760 }}>
        <ContactFormAdmin settings={settings} />
      </div>
    </>
  );
}
