import { redirect } from "next/navigation";
import { AccountForm } from "@/components/admin/AccountForm";
import { getSession } from "@/lib/auth";

export default async function AdminAccountPage() {
  const session = await getSession();
  if (!session) redirect("/admin/giris");

  return (
    <>
      <div className="admin-top">
        <h2>Hesabım</h2>
      </div>
      <div className="admin-panel" style={{ maxWidth: 760 }}>
        <AccountForm email={session.email} />
      </div>
    </>
  );
}
