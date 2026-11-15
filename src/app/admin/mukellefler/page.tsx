import Link from "next/link";
import { redirect } from "next/navigation";
import {
  addRequestsForAllAction,
  createMukellefAction,
  togglePortalAction,
} from "@/app/actions/portal-admin";
import { NextStep, StatTile, StatTiles } from "@/components/portal/AdminBits";
import { PortalForm } from "@/components/portal/PortalForm";
import { getSession } from "@/lib/auth";
import { isPortalEnabled, listMukellefler } from "@/lib/portal-db";
import { portalMailReady, portalUrl } from "@/lib/portal-mail";
import {
  describeBalance,
  formatDateTime,
} from "@/lib/portal-shared";

export const dynamic = "force-dynamic";

export default async function AdminMukelleflerPage() {
  const session = await getSession();
  if (!session) redirect("/admin/giris");

  const [enabled, list] = await Promise.all([isPortalEnabled(), listMukellefler()]);
  const mailReady = portalMailReady();
  const loginUrl = portalUrl("/giris");

  const activeCount = list.filter((item) => item.active).length;
  const awaiting = list.filter((item) => item.active && !item.hasPassword);
  const openTotal = list.reduce((sum, item) => sum + item.openRequests, 0);
  const newTotal = list.reduce((sum, item) => sum + item.newFiles, 0);
  const firstWithNew = list.find((item) => item.newFiles > 0);

  const detail = (id: string, tab?: string) =>
    `/admin/mukellefler/${id}${tab ? `?sekme=${tab}` : ""}`;

  let step: { text: string; href?: string; label?: string };
  if (!enabled) {
    step = {
      text: "Mükellef Köşesi şu an kapalı. Aşağıdaki “Mükellef Köşesi” kutusunda onay kutusunu işaretleyip Kaydet’e basarak açın.",
    };
  } else if (list.length === 0) {
    step = {
      text: "İlk mükellefi ekleyin: sayfanın altındaki “Yeni mükellef ekle” formunu doldurun. Size bir davet bağlantısı verilir; bunu mükellefe iletin, şifresini kendisi belirlesin.",
    };
  } else if (firstWithNew) {
    step = {
      text: `Mükelleflerden ${newTotal} yeni mesaj ya da belge geldi. Tabloda “Yeni” rozetli satırı açıp Mesajlar sekmesinden okuyabilirsiniz.`,
      href: detail(firstWithNew.id, "mesajlar"),
      label: `${firstWithNew.name} mesajları`,
    };
  } else if (awaiting.length > 0) {
    step = {
      text: `${awaiting.length} mükellef davet bağlantısını henüz kullanmadı (şifresini belirlemedi). Bağlantıyı iletmediyseniz mükellefin sayfasından yeni bir bağlantı üretin.`,
      href: detail(awaiting[0].id),
      label: `${awaiting[0].name} sayfası`,
    };
  } else if (openTotal > 0) {
    step = {
      text: `Mükelleflerden ${openTotal} belge bekleniyor. Mükellef yükleyince talep otomatik “Tamam” olur.`,
    };
  } else {
    step = {
      text: "Bekleyen bir iş yok. Belge istemek için aşağıdaki “Tüm mükelleflerden belge iste” bölümünü kullanabilirsiniz.",
    };
  }

  return (
    <>
      <div className="admin-top">
        <h2>Mükellefler</h2>
      </div>

      <div className="admin-stack">
        <StatTiles>
          <StatTile label="Mükellef" value={list.length} hint={`${activeCount} tanesi etkin`} />
          <StatTile
            label="Davet bekleyen"
            value={awaiting.length}
            hint="şifresini henüz belirlemedi"
            attention={awaiting.length > 0}
          />
          <StatTile
            label="Yeni gelen mesaj"
            value={newTotal}
            hint="mükellefin gönderdiği, açmadığınız"
            attention={newTotal > 0}
          />
          <StatTile
            label="Bekleyen belge"
            value={openTotal}
            hint="istediğiniz, henüz gelmeyen"
          />
        </StatTiles>

        <NextStep href={step.href} linkLabel={step.label}>
          {step.text}
        </NextStep>

        <div className="admin-panel">
          <h3 className="admin-section-title">
            Mükellef Köşesi{" "}
            {enabled ? (
              <span className="portal-badge is-ok">Açık</span>
            ) : (
              <span className="portal-badge is-warn">Kapalı</span>
            )}
          </h3>
          <p className="portal-help">
            Mükelleflerinizin kendi şifresiyle girip size mesaj ve belge gönderdiği, sizin de
            tahakkuk ve beyanname gibi dosyaları ilettiğiniz bölümdür. Kapalıyken sitede hiçbir iz görünmez.
          </p>
          <PortalForm
            action={togglePortalAction}
            submitLabel="Kaydet"
            className="admin-form"
          >
            <label className="checkbox-row">
              <input type="checkbox" name="enabled" defaultChecked={enabled} />
              Mükellef Köşesi açık olsun
            </label>
          </PortalForm>
          {enabled ? (
            <p className="portal-note" style={{ marginBottom: 0 }}>
              Mükelleflerin giriş adresi: <strong>{loginUrl ?? "/mukellef/giris"}</strong>
            </p>
          ) : null}
        </div>

        <div className="admin-panel">
          <h3 className="admin-section-title">Mükellef listesi</h3>
          {list.length === 0 ? (
            <p style={{ margin: 0 }}>
              Henüz mükellef eklenmedi. Aşağıdaki “Yeni mükellef ekle” formundan başlayın.
            </p>
          ) : (
            <>
              <div className="portal-table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Mükellef</th>
                      <th>Durum</th>
                      <th className="num">Bekleyen belge</th>
                      <th className="num">Yeni gelen</th>
                      <th>Bakiye</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <Link href={detail(item.id)}>
                            <strong>{item.name}</strong>
                          </Link>
                          <div className="portal-meta">{item.email}</div>
                        </td>
                        <td>
                          {!item.active ? (
                            <>
                              <span className="portal-badge is-warn">Devre dışı</span>
                              <div className="portal-meta">Giriş yapamaz</div>
                            </>
                          ) : !item.hasPassword ? (
                            <>
                              <span className="portal-badge">Davet bekliyor</span>
                              <div className="portal-meta">Şifre belirlenmedi</div>
                            </>
                          ) : (
                            <>
                              <span className="portal-badge is-ok">Aktif</span>
                              <div className="portal-meta">
                                {item.lastLoginAt
                                  ? `Son giriş: ${formatDateTime(item.lastLoginAt)}`
                                  : "Henüz giriş yapmadı"}
                              </div>
                            </>
                          )}
                        </td>
                        <td className="num">{item.openRequests}</td>
                        <td className="num">
                          {item.newFiles > 0 ? (
                            <span className="portal-badge is-new">{item.newFiles}</span>
                          ) : (
                            0
                          )}
                        </td>
                        <td>{describeBalance(item.balanceKurus)}</td>
                        <td>
                          <Link
                            href={detail(item.id)}
                            className="btn btn-secondary"
                            style={{ padding: "0.45rem 0.8rem" }}
                          >
                            Aç
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="portal-note" style={{ marginBottom: 0 }}>
                <strong>Bekleyen belge:</strong> sizin istediğiniz ama mükellefin henüz
                göndermediği belgeler. <strong>Yeni gelen:</strong> mükellefin gönderdiği, sizin
                henüz açmadığınız mesaj ya da belgeler. <strong>Bakiye:</strong> mükellefin size
                borcu (bilgi amaçlıdır).
              </p>
            </>
          )}
        </div>

        <div className="admin-panel">
          <h3 className="admin-section-title">Yeni mükellef ekle</h3>
          <PortalForm
            action={createMukellefAction}
            submitLabel="Mükellef ekle ve davet bağlantısı üret"
            resetOnSuccess
          >
            <div className="form-row">
              <label>
                Ad / ünvan
                <input name="name" required maxLength={120} placeholder="Örnek Ticaret Ltd. Şti." />
              </label>
              <label>
                E-posta (giriş adı)
                <input name="email" type="email" required maxLength={120} placeholder="muhasebe@firma.com" />
              </label>
            </div>
            <label>
              Not (yalnızca siz görürsünüz)
              <input name="note" maxLength={500} placeholder="Vergi no, yetkili kişi vb." />
            </label>
            <label className="checkbox-row">
              <input type="checkbox" name="send" defaultChecked={mailReady} disabled={!mailReady} />
              Daveti e-postayla da gönder{mailReady ? "" : " (e-posta kapalı)"}
            </label>
            <p className="form-hint">
              Eklediğinizde size bir davet bağlantısı verilir. Mükellef bu bağlantıyla kendi
              şifresini belirler; şifreyi siz hiç görmezsiniz.
            </p>
          </PortalForm>
        </div>

        {activeCount > 0 ? (
          <details className="admin-panel">
            <summary>Tüm mükelleflerden belge iste</summary>
            <p className="portal-help">
              Her satıra bir belge yazın; etkin tüm mükelleflerin “eksik belgeler” listesine
              eklenir. Aynı adlı açık talep tekrar eklenmez.
            </p>
            <PortalForm
              action={addRequestsForAllAction}
              submitLabel="Tüm etkin mükelleflerden iste"
              resetOnSuccess
            >
              <label>
                İstenen belgeler (her satıra bir tane)
                <textarea
                  name="titles"
                  rows={4}
                  required
                  placeholder={"Banka ekstresi\nGider faturaları\nPersonel puantaj listesi"}
                />
              </label>
              <label>
                Not (isteğe bağlı)
                <input name="note" maxLength={300} placeholder="Ayın 10'una kadar iletirseniz sevinirim" />
              </label>
            </PortalForm>
          </details>
        ) : null}

        <details className="admin-panel portal-warning">
          <summary>Kullanmadan önce bilmeniz gerekenler</summary>
          <ul>
            <li>
              Mükelleflerin belgeleri (fatura, banka ekstresi, bordro vb.) bu sitenin
              sunucusunda saklanır. KVKK bakımından veri sorumlusu sizsiniz; KVKK aydınlatma
              metninize ve mükelleflerle sözleşmenize bu saklamayı ekleyin.
            </li>
            <li>
              Sunucuya erişimi olanlar (barındırma firması, bu siteyi sizin için kuran kişi)
              dosyalara teknik olarak erişebilir; erişimi sınırlı tutun ve düzenli yedek alın.
            </li>
            <li>
              Bu bölüm beyannameyi GİB&apos;e göndermez; yalnızca PDF gibi dosyaları iletir.
              Yüklenen dosyalar virüs taramasından geçirilmez (yalnızca tür ve içerik
              biçimi denetlenir); ZIP dosyalarının içi de denetlenmez, açmadan önce tarayın.
            </li>
            <li>
              Hesap ekstresi bilgi amaçlıdır; fatura ya da makbuz yerine geçmez.
            </li>
            {!mailReady ? (
              <li>
                <strong>E-posta gönderimi kapalı</strong> (.env içinde SMTP tanımlı değil): davet
                ve şifre bağlantılarını mükellefe kendiniz iletmeniz gerekir; bildirim e-postaları
                gitmez.
              </li>
            ) : null}
          </ul>
        </details>
      </div>
    </>
  );
}
