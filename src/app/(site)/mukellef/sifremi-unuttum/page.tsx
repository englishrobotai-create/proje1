import Link from "next/link";
import { forgotPasswordAction } from "@/app/actions/portal";
import { PortalForm } from "@/components/portal/PortalForm";
import { portalMailReady } from "@/lib/portal-mail";

export default function PortalForgotPage() {
  const mailReady = portalMailReady();

  return (
    <div className="portal-auth">
      <div className="info-panel">
        <h2>Şifremi unuttum</h2>
        {mailReady ? (
          <PortalForm action={forgotPasswordAction} submitLabel="Bağlantı gönder" pendingLabel="Gönderiliyor...">
            <p>Kayıtlı e-posta adresinizi yazın; şifrenizi yenilemeniz için bir bağlantı gönderelim.</p>
            <label>
              E-posta
              <input name="email" type="email" required maxLength={120} autoComplete="username" />
            </label>
          </PortalForm>
        ) : (
          <p>
            Bu sitede e-posta gönderimi kapalı. Yeni şifre bağlantısı için lütfen{" "}
            <Link href="/iletisim" style={{ textDecoration: "underline" }}>
              ofisle iletişime geçin
            </Link>
            .
          </p>
        )}
        <div className="portal-links">
          <Link href="/mukellef/giris">← Girişe dön</Link>
        </div>
      </div>
    </div>
  );
}
