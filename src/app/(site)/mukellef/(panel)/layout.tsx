import { redirect } from "next/navigation";
import { portalLogoutAction } from "@/app/actions/portal";
import { PortalNav } from "@/components/portal/PortalNav";
import { getPortalSession } from "@/lib/portal-auth";

// Panel sayfalarının hepsi oturum ister; tek denetim noktası burasıdır.
export default async function PortalPanelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getPortalSession();
  if (!session) redirect("/mukellef/giris");

  return (
    <>
      <div className="portal-bar">
        <div>
          <strong>{session.name}</strong>
          <div className="portal-meta">{session.email}</div>
        </div>
        <PortalNav />
        <form action={portalLogoutAction}>
          <button type="submit" className="btn btn-secondary" style={{ padding: "0.5rem 0.9rem" }}>
            Çıkış yap
          </button>
        </form>
      </div>
      {children}
    </>
  );
}
