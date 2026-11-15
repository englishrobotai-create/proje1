import { redirect } from "next/navigation";
import { ContactFormAdmin } from "@/components/admin/ContactFormAdmin";
import { ProfessionalInfoForm } from "@/components/admin/ProfessionalInfoForm";
import { getSession } from "@/lib/auth";
import { missingProfessionalLabels } from "@/lib/professional-fields";
import { getProfessionalInfo } from "@/lib/professional-info";
import { getSiteSettings } from "@/lib/settings";

export default async function AdminContactPage() {
  const session = await getSession();
  if (!session) redirect("/admin/giris");

  const [settings, professional] = await Promise.all([
    getSiteSettings(),
    getProfessionalInfo(),
  ]);
  const missing = missingProfessionalLabels(professional);

  return (
    <>
      <div className="admin-top">
        <h2>İletişim Sayfası</h2>
      </div>
      <div className="admin-panel" style={{ maxWidth: 760 }}>
        <ContactFormAdmin settings={settings} />
      </div>

      <div className="admin-top" style={{ marginTop: "2rem" }}>
        <h2>Mesleki Bilgiler</h2>
      </div>
      <div className="admin-panel" style={{ maxWidth: 760 }}>
        <p style={{ marginTop: 0, color: "var(--ink-soft)" }}>
          Bu bilgiler Hakkımda ve İletişim sayfalarında görünür. Boş bıraktığınız
          alan sitede gösterilmez. SMMM/YMM Haksız Rekabet ve Reklam Yasağı
          Yönetmeliği&apos;nin 22. maddesi, sitede bu bilgilerin bulunmasını
          ister; adres, telefon ve e-posta yukarıdaki ofis bilgilerinden gelir.
          Kuralın size nasıl uygulandığını bağlı olduğunuz odaya sorun.
        </p>
        {missing.length > 0 ? (
          <p style={{ color: "var(--ink-soft)" }}>
            <strong>Henüz doldurulmamış:</strong> {missing.join(", ")}.
          </p>
        ) : null}
        <ProfessionalInfoForm info={professional} />
      </div>
    </>
  );
}
