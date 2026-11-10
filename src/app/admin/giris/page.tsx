import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getSession } from "@/lib/auth";

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session) redirect("/admin");

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Yönetici Girişi</h1>
        <p>Blog ve site başlığını buradan yönetirsiniz.</p>
        <LoginForm />
      </div>
    </div>
  );
}
