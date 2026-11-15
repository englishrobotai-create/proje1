import Link from "next/link";
import { redirect } from "next/navigation";
import { KvkkForm } from "@/components/admin/KvkkForm";
import { KvkkTextForm } from "@/components/admin/KvkkTextForm";
import { getSession } from "@/lib/auth";
import { getKvkkInfo } from "@/lib/kvkk-info";
import { buildKvkkTemplate, kvkkTemplateInput } from "@/lib/kvkk-text";
import { getSiteSettings } from "@/lib/settings";

export default async function AdminKvkkPage() {
  const session = await getSession();
  if (!session) redirect("/admin/giris");

  const [settings, info] = await Promise.all([getSiteSettings(), getKvkkInfo()]);
  const template = buildKvkkTemplate(kvkkTemplateInput(settings, info));
  const isCustom = info.customText.length > 0;

  return (
    <>
      <div className="admin-top">
        <h2>KVKK Aydınlatma Metni</h2>
        <Link href="/kvkk" target="_blank" className="btn btn-secondary">
          Sayfayı Gör
        </Link>
      </div>

      <div className="admin-panel" style={{ maxWidth: 820 }}>
        <p style={{ marginTop: 0, color: "var(--ink-soft)" }}>
          Sitedeki görüşme talebi formunun altındaki bağlantı bu sayfaya gider.
          Hazır bir metinle başlarsınız; isterseniz aşağıdaki alanlarla
          özelleştirir, isterseniz metnin tamamını kendiniz yazarsınız.
        </p>
        <p style={{ color: "var(--ink-soft)" }}>
          <strong>Önemli:</strong> Hazır metin genel bir şablondur, hukuki görüş
          değildir. Yayına almadan önce müşterinin gerçek uygulamasıyla (saklama
          süresi, sunucu ve e-posta hizmetinin yeri, ek veri toplama) uyuştuğunu
          kontrol edin ve gerekirse bir hukukçuya gösterin. Siteye analiz veya
          reklam kodu eklenirse çerez bölümü de güncellenmelidir.
        </p>
        {isCustom ? (
          <p className="form-success" style={{ margin: 0 }}>
            Şu an sizin yazdığınız metin gösteriliyor. Aşağıdaki şablon alanları ve
            İletişim sayfasındaki adres, e-posta, telefon değişiklikleri bu metni
            etkilemez.
          </p>
        ) : null}
      </div>

      <div className="admin-top" style={{ marginTop: "2rem" }}>
        <h2>Şablon alanları</h2>
      </div>
      <div className="admin-panel" style={{ maxWidth: 820 }}>
        <p style={{ marginTop: 0, color: "var(--ink-soft)" }}>
          Hazır metne girecek müşteriye özel bilgiler. Veri sorumlusu bilgileri
          (adres, e-posta, telefon) İletişim sayfasından gelir.
          {isCustom ? " Özel metin kullanıldığı için bu alanlar şu an sayfada görünmez." : ""}
        </p>
        <KvkkForm info={info} />
      </div>

      <div className="admin-top" style={{ marginTop: "2rem" }}>
        <h2>Metnin tamamını düzenle</h2>
      </div>
      <div className="admin-panel" style={{ maxWidth: 820 }}>
        <KvkkTextForm
          initialText={isCustom ? info.customText : template}
          isCustom={isCustom}
        />
      </div>
    </>
  );
}
