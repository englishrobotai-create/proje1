import { redirect } from "next/navigation";
import { ServiceForm } from "@/components/admin/ServiceForm";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function NewServicePage() {
  const session = await getSession();
  if (!session) redirect("/admin/giris");

  const count = await prisma.service.count();

  return (
    <>
      <div className="admin-top">
        <h2>Yeni Hizmet</h2>
      </div>
      <div className="admin-panel" style={{ maxWidth: 760 }}>
        <ServiceForm
          mode="create"
          defaults={{ title: "", description: "", sortOrder: count }}
        />
      </div>
    </>
  );
}
