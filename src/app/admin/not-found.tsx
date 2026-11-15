import Link from "next/link";

// Yönetim panelindeki notFound() çağrıları için; herkese açık site menüsü çizilmez.
export default function AdminNotFound() {
  return (
    <>
      <div className="admin-top">
        <h2>Kayıt bulunamadı</h2>
        <Link href="/admin" className="btn btn-primary">
          Özete dön
        </Link>
      </div>
      <div className="admin-panel">
        <p style={{ margin: 0, color: "var(--ink-soft)" }}>
          Aradığınız kayıt silinmiş ya da adres yanlış yazılmış olabilir.
        </p>
      </div>
    </>
  );
}
