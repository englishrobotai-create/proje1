import { notFound, redirect } from "next/navigation";
import { ServiceForm } from "@/components/admin/ServiceForm";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditServicePage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect("/admin/giris");

  const { id } = await params;
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) notFound();

  return (
    <>
      <div className="admin-top">
        <h2>Hizmeti Düzenle</h2>
      </div>
      <div className="admin-panel" style={{ maxWidth: 760 }}>
        <ServiceForm
          mode="edit"
          serviceId={service.id}
          defaults={{
            title: service.title,
            description: service.description,
            sortOrder: service.sortOrder,
          }}
        />
      </div>
    </>
  );
}
