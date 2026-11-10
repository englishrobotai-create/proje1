import Link from "next/link";
import { redirect } from "next/navigation";
import { deleteServiceAction } from "@/app/actions/services";
import { ServicesIntroForm } from "@/components/admin/ServicesIntroForm";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";

export default async function AdminServicesPage() {
  const session = await getSession();
  if (!session) redirect("/admin/giris");

  const [settings, services] = await Promise.all([
    getSiteSettings(),
    prisma.service.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <div className="admin-top">
        <h2>Hizmetler</h2>
        <Link href="/admin/hizmetler/yeni" className="btn btn-primary">
          Yeni Hizmet
        </Link>
      </div>

      <div className="admin-panel" style={{ maxWidth: 760, marginBottom: "1rem" }}>
        <ServicesIntroForm intro={settings.servicesIntro} />
      </div>

      <div className="admin-panel">
        {services.length === 0 ? (
          <p style={{ margin: 0 }}>Henüz hizmet yok. İlk hizmeti ekleyin.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Sıra</th>
                <th>Başlık</th>
                <th>Açıklama</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td>{service.sortOrder}</td>
                  <td>
                    <strong>{service.title}</strong>
                  </td>
                  <td>{service.description}</td>
                  <td>
                    <div className="row-actions">
                      <Link
                        href={`/admin/hizmetler/${service.id}`}
                        className="btn btn-secondary"
                        style={{ padding: "0.45rem 0.8rem" }}
                      >
                        Düzenle
                      </Link>
                      <form action={deleteServiceAction.bind(null, service.id)}>
                        <button
                          type="submit"
                          className="btn btn-danger"
                          style={{ padding: "0.45rem 0.8rem" }}
                        >
                          Sil
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
