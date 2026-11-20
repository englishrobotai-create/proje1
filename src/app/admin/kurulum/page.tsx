import { redirect } from "next/navigation";
import { SetupForm } from "@/components/admin/SetupForm";
import { getSession, needsAdminSetup } from "@/lib/auth";

/**
 * İlk yönetici hesabı. Veritabanında hiç kullanıcı yokken açılır; biri oluşunca kapanır.
 * Vercel gibi ortamlarda local `npm run db:seed` gerekmeden tarayıcıdan kurulum sağlar.
 */
export default async function AdminSetupPage() {
  if (!(await needsAdminSetup())) {
    const session = await getSession();
    redirect(session ? "/admin" : "/admin/giris");
  }

  const session = await getSession();
  if (session) redirect("/admin");

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>İlk kurulum</h1>
        <p>
          Henüz yönetici yok. Kendi e-posta ve şifrenizle ilk hesabı oluşturun;
          ardından siteyi panelden yönetirsiniz.
        </p>
        <SetupForm />
      </div>
    </div>
  );
}
