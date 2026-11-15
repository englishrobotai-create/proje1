import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  addLedgerAction,
  addRequestsAction,
  deleteFileAdminAction,
  deleteLedgerAction,
  deleteMukellefAction,
  deleteRequestAction,
  newLinkAction,
  setMukellefActiveAction,
  sendOfficeMessageAction,
  setRequestStatusAction,
  updateMukellefAction,
} from "@/app/actions/portal-admin";
import { NextStep, StatTile, StatTiles } from "@/components/portal/AdminBits";
import { ConfirmButton } from "@/components/portal/ConfirmButton";
import { PortalForm } from "@/components/portal/PortalForm";
import { getSession } from "@/lib/auth";
import {
  getMukellef,
  isId,
  ledgerBalance,
  listDocRequests,
  listFiles,
  listLedger,
  markFileRead,
  withRunningBalance,
} from "@/lib/portal-db";
import { maxUploadBytes } from "@/lib/portal-files";
import { portalMailReady, portalUrl } from "@/lib/portal-mail";
import {
  ALLOWED_EXTENSIONS_LABEL,
  MESSAGE_BODY_MAX,
  describeBalance,
  formatDateOnly,
  formatDateTime,
  formatKurus,
  formatPeriod,
  formatSize,
  hasAttachment,
  todayDateOnly,
} from "@/lib/portal-shared";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "genel", label: "Genel" },
  { key: "mesajlar", label: "Mesajlar" },
  { key: "talepler", label: "Eksik belgeler" },
  { key: "hesap", label: "Hesap ekstresi" },
  { key: "ayarlar", label: "Ayarlar" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function tabOf(value: string | string[] | undefined): TabKey {
  const raw = Array.isArray(value) ? value[0] : value;
  const wanted = raw === "belgeler" ? "mesajlar" : raw; // eski bağlantılar
  return TABS.find((tab) => tab.key === wanted)?.key ?? "genel";
}

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sekme?: string | string[] }>;
};

export default async function AdminMukellefDetailPage({ params, searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/admin/giris");

  const { id } = await params;
  if (!isId(id)) notFound();
  const mukellef = await getMukellef(id);
  if (!mukellef) notFound();
  const tab = tabOf((await searchParams).sekme);

  const [files, requests, ledger] = await Promise.all([
    listFiles(id),
    listDocRequests(id),
    listLedger(id),
  ]);
  const lines = withRunningBalance(ledger);
  const balance = ledgerBalance(ledger);
  const now = new Date();
  const mailReady = portalMailReady();
  const loginUrl = portalUrl("/giris");
  const openRequests = requests.filter((request) => request.status === "open");
  const incoming = files.filter((file) => file.direction === "from_mukellef");
  const outgoing = files.filter((file) => file.direction === "from_office");
  const newFromClient = incoming.filter((file) => file.readAt === "").length;

  // Yalnızca metin içeren mesajların indirilecek bir eki yoktur; Mesajlar sekmesi açılınca okundu
  // sayılır. "Yeni" rozeti bu görüntülemede yine de görünür (aşağıda eski değerlerle çizilir).
  // Sayfa önceden yükleme (prefetch) isteğiyse okundu işaretlenmez.
  if (tab === "mesajlar") {
    const requestHeaders = await headers();
    const isPrefetch =
      requestHeaders.get("next-router-prefetch") !== null ||
      requestHeaders.get("purpose") === "prefetch";
    if (!isPrefetch) {
      await Promise.all(
        files
          .filter(
            (file) =>
              file.direction === "from_mukellef" && file.readAt === "" && !hasAttachment(file),
          )
          .map((file) => markFileRead(file.id)),
      );
    }
  }

  const tabHref = (key: TabKey) =>
    key === "genel" ? `/admin/mukellefler/${id}` : `/admin/mukellefler/${id}?sekme=${key}`;

  // "Sıradaki adım": en acil işi tek cümleyle söyler; zaten o sekmedeysek kısayol göstermez.
  let step: { text: string; target?: TabKey; label?: string };
  if (!mukellef.active) {
    step = {
      text: "Bu mükellefin girişi kapalı; şu an belge gönderemez ve göremez. Yeniden açmak için Ayarlar sekmesini kullanın.",
      target: "ayarlar",
      label: "Ayarlara git",
    };
  } else if (!mukellef.hasPassword) {
    step = {
      text: "Mükellef henüz şifresini belirlemedi. Davet bağlantısını ona iletin; bağlantıyı kaybettiyseniz aşağıdan yenisini üretin.",
      target: "genel",
      label: "Bağlantı üret",
    };
  } else if (newFromClient > 0) {
    step = {
      text: `Mükellef size ${newFromClient} yeni mesaj ya da belge gönderdi; henüz açmadınız.`,
      target: "mesajlar",
      label: "Mesajları gör",
    };
  } else if (openRequests.length > 0) {
    step = {
      text: `Mükelleften ${openRequests.length} belge bekleniyor. Mükellef yükleyince talep otomatik “Tamam” olur.`,
      target: "talepler",
      label: "Talepleri gör",
    };
  } else {
    step = {
      text: "Bekleyen bir iş yok. Mükelleften belge isteyebilir ya da ona mesaj gönderebilirsiniz.",
      target: "talepler",
      label: "Belge iste",
    };
  }
  const showStepLink = step.target && step.target !== tab;

  return (
    <>
      <div className="admin-top">
        <h2>{mukellef.name}</h2>
        <Link href="/admin/mukellefler" className="btn btn-secondary">
          ← Tüm mükellefler
        </Link>
      </div>

      <div className="admin-stack">
        <div className="admin-actions">
          {!mukellef.active ? (
            <span className="portal-badge is-warn">Devre dışı</span>
          ) : !mukellef.hasPassword ? (
            <span className="portal-badge">Davet bekliyor</span>
          ) : (
            <span className="portal-badge is-ok">Aktif</span>
          )}
          <span className="portal-meta">{mukellef.email}</span>
          {mukellef.lastLoginAt ? (
            <span className="portal-meta">· Son giriş: {formatDateTime(mukellef.lastLoginAt)}</span>
          ) : null}
        </div>

        <StatTiles>
          <StatTile
            label="Bekleyen belge"
            value={openRequests.length}
            hint="sizin istediğiniz, henüz gelmeyen"
            attention={openRequests.length > 0}
          />
          <StatTile
            label="Yeni gelen mesaj"
            value={newFromClient}
            hint="mükellefin gönderdiği, açmadığınız"
            attention={newFromClient > 0}
          />
          <StatTile label="Bakiye" value={describeBalance(balance)} hint="mükellefin size borcu" />
        </StatTiles>

        <NextStep
          href={showStepLink && step.target ? tabHref(step.target) : undefined}
          linkLabel={showStepLink ? step.label : undefined}
        >
          {step.text}
        </NextStep>

        <nav className="portal-tabs" aria-label="Mükellef bölümleri">
          {TABS.map((item) => (
            <Link
              key={item.key}
              href={tabHref(item.key)}
              aria-current={item.key === tab ? "page" : undefined}
            >
              {item.label}
              {item.key === "mesajlar" && newFromClient > 0 ? (
                <span className="portal-badge is-new">{newFromClient}</span>
              ) : null}
              {item.key === "talepler" && openRequests.length > 0 ? (
                <span className="portal-badge is-warn">{openRequests.length}</span>
              ) : null}
            </Link>
          ))}
        </nav>

        {tab === "genel" ? (
          <>
            <div className="admin-panel">
              <h3 className="admin-section-title">
                {mukellef.hasPassword ? "Şifre sıfırlama bağlantısı" : "Davet bağlantısı"}
              </h3>
              <p className="portal-help">
                Mükellef <strong>{mukellef.email}</strong> adresi ve kendi belirlediği şifreyle{" "}
                <strong>{loginUrl ?? "/mukellef/giris"}</strong> adresinden giriş yapar.{" "}
                {mukellef.hasPassword
                  ? "Şifresini unuttuysa yeni bir bağlantı üretin; eski bağlantılar geçersiz olur. Mükellef bağlantıyla yeni şifresini kendisi belirler."
                  : "İlk girişte şifresini belirlemesi için aşağıdan bağlantı üretip ona iletin. Bağlantı 72 saat geçerli ve tek kullanımlıktır; güvenlik için saklanmaz, bu yüzden gerekirse yenisini üretin."}
              </p>
              <PortalForm
                action={newLinkAction.bind(null, id)}
                submitLabel="Yeni bağlantı üret"
                buttonClassName="btn btn-secondary"
              >
                <label className="checkbox-row">
                  <input type="checkbox" name="send" defaultChecked={mailReady} disabled={!mailReady} />
                  E-postayla da gönder ({mukellef.email}){mailReady ? "" : " — e-posta kapalı"}
                </label>
              </PortalForm>
            </div>

            <div className="admin-panel">
              <h3 className="admin-section-title">Son mesajlar</h3>
              {files.length === 0 ? (
                <p style={{ margin: 0 }}>Henüz mesaj ya da belge yok.</p>
              ) : (
                <>
                  <ul className="portal-list">
                    {files.slice(0, 5).map((file) => (
                      <li key={file.id}>
                        <div>
                          <strong>{file.title}</strong>
                          <div className="portal-meta">
                            {file.direction === "from_mukellef"
                              ? `${mukellef.name} → Siz`
                              : `Siz → ${mukellef.name}`}{" "}
                            · {formatDateTime(file.createdAt)}
                            {hasAttachment(file) ? " · ek dosya var" : ""}
                          </div>
                        </div>
                        {file.direction === "from_mukellef" && file.readAt === "" ? (
                          <span className="portal-badge is-new">Yeni</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  <p style={{ margin: "0.75rem 0 0" }}>
                    <Link href={tabHref("mesajlar")} className="portal-link">
                      Tüm mesajları gör ({files.length})
                    </Link>
                  </p>
                </>
              )}
            </div>
          </>
        ) : null}

        {tab === "mesajlar" ? (
          <>
            <div className="admin-panel">
              <h3 className="admin-section-title">Mükelleften gelenler ({incoming.length})</h3>
              {incoming.length === 0 ? (
                <p style={{ margin: 0 }}>Bu mükellef henüz size mesaj ya da belge göndermedi.</p>
              ) : (
                <div className="portal-table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Mesaj</th>
                        <th>Kimden / Kime</th>
                        <th>Tarih</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {incoming.map((file) => (
                        <tr key={file.id}>
                          <td>
                            <strong>{file.title}</strong>
                            {file.readAt === "" ? (
                              <span className="portal-badge is-new" style={{ marginLeft: 8 }}>
                                Yeni
                              </span>
                            ) : null}
                            {file.body ? <div className="portal-body">{file.body}</div> : null}
                            {hasAttachment(file) ? (
                              <div className="portal-meta">
                                Ek: {file.originalName} · {formatSize(file.size)}
                                {file.period ? ` · ${formatPeriod(file.period)}` : ""}
                              </div>
                            ) : null}
                          </td>
                          <td>
                            <div>
                              <span className="portal-meta">Kimden:</span> {mukellef.name}
                            </div>
                            <div>
                              <span className="portal-meta">Kime:</span> Siz
                            </div>
                          </td>
                          <td>{formatDateTime(file.createdAt)}</td>
                          <td>
                            <div className="row-actions">
                              {hasAttachment(file) ? (
                                <a
                                  href={`/admin/mukellefler/dosya/${file.id}`}
                                  className="btn btn-secondary"
                                  style={{ padding: "0.4rem 0.7rem" }}
                                >
                                  Eki indir
                                </a>
                              ) : null}
                              <form action={deleteFileAdminAction.bind(null, file.id)}>
                                <ConfirmButton
                                  message="Bu mesaj (varsa eki ile birlikte) kalıcı olarak silinsin mi?"
                                  className="btn btn-danger"
                                  style={{ padding: "0.4rem 0.7rem" }}
                                >
                                  Sil
                                </ConfirmButton>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="admin-panel">
              <h3 className="admin-section-title">Mükellefe mesaj gönder</h3>
              <p className="portal-help">
                Mesajınız mükellefin köşesinde görünür. İsterseniz tahakkuk fişi, beyanname gibi bir
                dosya da ekleyebilirsiniz; ek zorunlu değildir. Tek dosya en fazla{" "}
                {formatSize(maxUploadBytes())}. Kabul edilenler: {ALLOWED_EXTENSIONS_LABEL}. Birden
                fazla dosyayı tek ZIP içinde gönderebilirsiniz.
              </p>
              <PortalForm
                action={sendOfficeMessageAction.bind(null, id)}
                submitLabel="Gönder"
                pendingLabel="Gönderiliyor..."
                resetOnSuccess
              >
                <label>
                  Başlık
                  <input name="title" required maxLength={120} placeholder="Örn. Ekim ayı KDV beyannamesi" />
                </label>
                <label>
                  Açıklama
                  <textarea
                    name="body"
                    rows={5}
                    maxLength={MESSAGE_BODY_MAX}
                    placeholder="Mükellefe iletmek istediğiniz not (isteğe bağlı)"
                  />
                </label>
                <label>
                  Ek dosya (isteğe bağlı)
                  <input name="file" type="file" />
                </label>
              </PortalForm>
            </div>

            <div className="admin-panel">
              <h3 className="admin-section-title">Mükellefe gönderdikleriniz ({outgoing.length})</h3>
              {outgoing.length === 0 ? (
                <p style={{ margin: 0 }}>Bu mükellefe henüz mesaj ya da belge göndermediniz.</p>
              ) : (
                <div className="portal-table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Mesaj</th>
                        <th>Kimden / Kime</th>
                        <th>Tarih</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {outgoing.map((file) => (
                        <tr key={file.id}>
                          <td>
                            <strong>{file.title}</strong>
                            {file.body ? <div className="portal-body">{file.body}</div> : null}
                            {hasAttachment(file) ? (
                              <div className="portal-meta">
                                Ek: {file.originalName} · {formatSize(file.size)}
                              </div>
                            ) : null}
                          </td>
                          <td>
                            <div>
                              <span className="portal-meta">Kimden:</span> Siz
                            </div>
                            <div>
                              <span className="portal-meta">Kime:</span> {mukellef.name}
                            </div>
                            <div className="portal-meta">
                              {file.readAt
                                ? `Mükellef açtı: ${formatDateTime(file.readAt)}`
                                : "Mükellef henüz açmadı"}
                            </div>
                            {file.hiddenByClientAt ? (
                              <div className="portal-meta">
                                Mükellef kendi listesinden sildi ({formatDateTime(file.hiddenByClientAt)});
                                sizde kayıtlı kalır.
                              </div>
                            ) : null}
                          </td>
                          <td>{formatDateTime(file.createdAt)}</td>
                          <td>
                            <div className="row-actions">
                              {hasAttachment(file) ? (
                                <a
                                  href={`/admin/mukellefler/dosya/${file.id}`}
                                  className="btn btn-secondary"
                                  style={{ padding: "0.4rem 0.7rem" }}
                                >
                                  Eki indir
                                </a>
                              ) : null}
                              <form action={deleteFileAdminAction.bind(null, file.id)}>
                                <ConfirmButton
                                  message="Bu mesaj (varsa eki ile birlikte) kalıcı olarak silinsin mi? Mükellef de artık göremez."
                                  className="btn btn-danger"
                                  style={{ padding: "0.4rem 0.7rem" }}
                                >
                                  Sil
                                </ConfirmButton>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}

        {tab === "talepler" ? (
          <>
            <div className="admin-panel">
              <h3 className="admin-section-title">
                İstenen belgeler{openRequests.length > 0 ? ` (${openRequests.length} bekleniyor)` : ""}
              </h3>
              <p className="portal-help">
                Mükellefin “eksik belgeler” listesinde görünen, sizin istediğiniz belgelerdir.
                Mükellef bu talebi seçerek dosya gönderdiğinde otomatik “Tamam” olur; dilerseniz elle
                de işaretleyebilirsiniz.
              </p>
              {requests.length === 0 ? (
                <p style={{ margin: 0 }}>Bu mükelleften istenen belge yok. Aşağıdan ekleyebilirsiniz.</p>
              ) : (
                <div className="portal-table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Belge</th>
                        <th>Durum</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((request) => (
                        <tr key={request.id}>
                          <td>
                            {request.title}
                            {request.period ? (
                              <span className="portal-meta"> · {formatPeriod(request.period)}</span>
                            ) : null}
                            {request.note ? <div className="portal-meta">{request.note}</div> : null}
                          </td>
                          <td>
                            {request.status === "open" ? (
                              <span className="portal-badge is-warn">Bekleniyor</span>
                            ) : (
                              <span className="portal-badge is-ok">Tamam</span>
                            )}
                            {request.fulfilledAt ? (
                              <div className="portal-meta">{formatDateTime(request.fulfilledAt)}</div>
                            ) : null}
                          </td>
                          <td>
                            <div className="row-actions">
                              <form
                                action={setRequestStatusAction.bind(
                                  null,
                                  request.id,
                                  request.status === "open" ? "done" : "open",
                                )}
                              >
                                <button
                                  type="submit"
                                  className="btn btn-secondary"
                                  style={{ padding: "0.4rem 0.7rem" }}
                                >
                                  {request.status === "open" ? "Tamam say" : "Yeniden aç"}
                                </button>
                              </form>
                              <form action={deleteRequestAction.bind(null, request.id)}>
                                <ConfirmButton
                                  message="Bu talep silinsin mi?"
                                  className="btn btn-danger"
                                  style={{ padding: "0.4rem 0.7rem" }}
                                >
                                  Sil
                                </ConfirmButton>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="admin-panel">
              <h3 className="admin-section-title">Belge iste</h3>
              <PortalForm action={addRequestsAction.bind(null, id)} submitLabel="Talep ekle" resetOnSuccess>
                <label>
                  İstenen belgeler (her satıra bir tane)
                  <textarea name="titles" rows={3} required placeholder={"Banka ekstresi\nGider faturaları"} />
                </label>
                <label>
                  Not (isteğe bağlı)
                  <input name="note" maxLength={300} />
                </label>
              </PortalForm>
            </div>
          </>
        ) : null}

        {tab === "hesap" ? (
          <>
            <div className="admin-panel">
              <h3 className="admin-section-title">Hesap ekstresi</h3>
              <p className="portal-help">
                Mükellefin size olan borcu: <strong>{describeBalance(balance)}</strong>. Mükellef bu
                tabloyu “Hesap ekstresi” sayfasında görür (bilgi amaçlıdır; fatura yerine geçmez).
              </p>
              {lines.length === 0 ? (
                <p style={{ margin: 0 }}>Henüz kayıt yok. Aşağıdan ilk kaydı ekleyin.</p>
              ) : (
                <div className="portal-table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Tarih</th>
                        <th>Açıklama</th>
                        <th className="num">Borç</th>
                        <th className="num">Ödeme</th>
                        <th className="num">Bakiye</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line) => (
                        <tr key={line.id}>
                          <td>{formatDateOnly(line.entryDate)}</td>
                          <td>{line.description}</td>
                          <td className="num">{line.kind === "charge" ? formatKurus(line.amountKurus) : ""}</td>
                          <td className="num">{line.kind === "payment" ? formatKurus(line.amountKurus) : ""}</td>
                          <td className="num">{formatKurus(line.balanceKurus)}</td>
                          <td>
                            <form action={deleteLedgerAction.bind(null, line.id)}>
                              <ConfirmButton
                                message="Bu kayıt silinsin mi?"
                                className="btn btn-danger"
                                style={{ padding: "0.4rem 0.7rem" }}
                              >
                                Sil
                              </ConfirmButton>
                            </form>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="admin-panel">
              <h3 className="admin-section-title">Kayıt ekle</h3>
              <PortalForm action={addLedgerAction.bind(null, id)} submitLabel="Kaydı ekle" resetOnSuccess>
                <div className="form-row">
                  <label>
                    İşlem
                    <select name="kind" defaultValue="charge">
                      <option value="charge">Borç yaz (ücret)</option>
                      <option value="payment">Ödeme al (tahsilat)</option>
                    </select>
                  </label>
                  <label>
                    Tarih
                    <input name="entryDate" type="date" required defaultValue={todayDateOnly(now)} />
                  </label>
                </div>
                <div className="form-row">
                  <label>
                    Tutar (TL)
                    <input name="amount" required inputMode="decimal" placeholder="1.250,00" />
                  </label>
                  <label>
                    Açıklama
                    <input name="description" required maxLength={160} placeholder="Ekim 2026 muhasebe ücreti" />
                  </label>
                </div>
              </PortalForm>
            </div>
          </>
        ) : null}

        {tab === "ayarlar" ? (
          <>
            <div className="admin-panel">
              <h3 className="admin-section-title">Mükellef bilgileri</h3>
              <PortalForm action={updateMukellefAction.bind(null, id)} submitLabel="Kaydet">
                <div className="form-row">
                  <label>
                    Ad / ünvan
                    <input name="name" required maxLength={120} defaultValue={mukellef.name} />
                  </label>
                  <label>
                    E-posta (giriş adı)
                    <input name="email" type="email" required maxLength={120} defaultValue={mukellef.email} />
                  </label>
                </div>
                <label>
                  Not (yalnızca siz görürsünüz)
                  <input name="note" maxLength={500} defaultValue={mukellef.note} />
                </label>
              </PortalForm>
            </div>

            <div className="admin-panel">
              <h3 className="admin-section-title">Girişi aç / kapat</h3>
              <p className="portal-help">
                {mukellef.active
                  ? "Mükellefin giriş yapıp belge göndermesini geçici olarak durdurabilirsiniz. Hiçbir veri silinmez; istediğiniz zaman yeniden açabilirsiniz."
                  : "Bu mükellefin girişi kapalı. Yeniden açtığınızda eski şifresiyle girebilir; bilgiler olduğu gibi durur."}
              </p>
              <form action={setMukellefActiveAction.bind(null, id, !mukellef.active)}>
                <button type="submit" className="btn btn-secondary">
                  {mukellef.active ? "Girişi kapat" : "Girişi yeniden aç"}
                </button>
              </form>
            </div>

            <div className="admin-panel portal-danger">
              <h3 className="admin-section-title">Mükellefi sil</h3>
              <p className="portal-help">
                Hesap, tüm belgeler (yüklenen dosyalar diskten de silinir), talepler ve ekstre kalıcı
                olarak silinir. Geri alınamaz. Geçici olarak erişimi kapatmak için “Girişi kapat”ı
                kullanın.
              </p>
              <PortalForm
                action={deleteMukellefAction.bind(null, id)}
                submitLabel="Mükellefi kalıcı olarak sil"
                pendingLabel="Siliniyor..."
                buttonClassName="btn btn-danger"
              >
                <label className="checkbox-row">
                  <input type="checkbox" name="confirm" />
                  Bu mükellefi ve tüm verilerini silmek istediğimi onaylıyorum
                </label>
              </PortalForm>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
