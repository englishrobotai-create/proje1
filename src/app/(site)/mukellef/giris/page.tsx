import Link from "next/link";
import { redirect } from "next/navigation";
import { portalLoginAction } from "@/app/actions/portal";
import { PortalForm } from "@/components/portal/PortalForm";
import { getPortalSession } from "@/lib/portal-auth";
import { portalMailReady } from "@/lib/portal-mail";

export default async function PortalLoginPage() {
  if (await getPortalSession()) redirect("/mukellef");

  return (
    <div className="portal-auth">
      <div className="info-panel">
        <h2>Giriş yapın</h2>
        <PortalForm
          action={portalLoginAction}
          submitLabel="Giriş Yap"
          pendingLabel="Giriş yapılıyor..."
        >
          <label>
            E-posta
            <input name="email" type="email" required maxLength={120} autoComplete="username" />
          </label>
          <label>
            Şifre
            <input name="password" type="password" required maxLength={200} autoComplete="current-password" />
          </label>
        </PortalForm>
        <div className="portal-links">
          {portalMailReady() ? (
            <Link href="/mukellef/sifremi-unuttum">Şifremi unuttum</Link>
          ) : null}
          <Link href="/iletisim">Hesabım yok / yardım</Link>
        </div>
        {portalMailReady() ? null : (
          <p className="portal-note">
            Şifrenizi unuttuysanız ofisle iletişime geçin; size yeni bir bağlantı gönderilir.
          </p>
        )}
      </div>
    </div>
  );
}
