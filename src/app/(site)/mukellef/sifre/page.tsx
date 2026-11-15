import Link from "next/link";
import { setPasswordAction } from "@/app/actions/portal";
import { PortalForm } from "@/components/portal/PortalForm";
import { findValidToken } from "@/lib/portal-db";
import { MIN_PASSWORD_LENGTH } from "@/lib/portal-shared";

type Props = { searchParams: Promise<{ token?: string | string[] }> };

export default async function PortalSetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const value = typeof token === "string" ? token : "";
  const valid = value ? await findValidToken(value) : null;

  if (!valid) {
    return (
      <div className="portal-auth">
        <div className="info-panel">
          <h2>Bağlantı geçersiz</h2>
          <p>
            Bu bağlantının süresi dolmuş, daha önce kullanılmış ya da hatalı. Ofisten yeni bir
            bağlantı isteyin.
          </p>
          <div className="portal-links">
            <Link href="/mukellef/giris">Girişe git</Link>
            <Link href="/iletisim">İletişim</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-auth">
      <div className="info-panel">
        <h2>{valid.purpose === "invite" ? "Şifrenizi belirleyin" : "Yeni şifre belirleyin"}</h2>
        <p>
          <strong>{valid.mukellef.name}</strong> hesabı için en az {MIN_PASSWORD_LENGTH} karakterlik bir
          şifre seçin.
        </p>
        <PortalForm
          action={setPasswordAction}
          submitLabel="Şifreyi kaydet ve giriş yap"
          pendingLabel="Kaydediliyor..."
        >
          <input type="hidden" name="token" value={value} />
          <label>
            Yeni şifre
            <input name="password" type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" />
          </label>
          <label>
            Şifre (tekrar)
            <input name="password2" type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" />
          </label>
        </PortalForm>
      </div>
    </div>
  );
}
