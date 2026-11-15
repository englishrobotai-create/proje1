import { headers } from "next/headers";
import { hideOfficeMessageAction, sendClientMessageAction } from "@/app/actions/portal";
import { ConfirmButton } from "@/components/portal/ConfirmButton";
import { PortalForm } from "@/components/portal/PortalForm";
import { getPortalSession } from "@/lib/portal-auth";
import { listDocRequests, listFilesForClient, markFileRead } from "@/lib/portal-db";
import { maxUploadBytes } from "@/lib/portal-files";
import {
  ALLOWED_EXTENSIONS_LABEL,
  MESSAGE_BODY_MAX,
  formatDateTime,
  formatPeriod,
  formatSize,
  hasAttachment,
} from "@/lib/portal-shared";

export default async function PortalMessagesPage() {
  const session = await getPortalSession();
  if (!session) return null;

  const [files, requests] = await Promise.all([
    listFilesForClient(session.id),
    listDocRequests(session.id),
  ]);
  const open = requests.filter((request) => request.status === "open");
  const fromOffice = files.filter((file) => file.direction === "from_office");
  const mine = files.filter((file) => file.direction === "from_mukellef");

  // Eki olmayan (yalnızca metin) mesajlar bu sayfa açılınca okundu sayılır; "Yeni" rozeti bu
  // görüntülemede yine de görünür. Önceden yükleme (prefetch) isteklerinde işaretlenmez.
  const requestHeaders = await headers();
  const isPrefetch =
    requestHeaders.get("next-router-prefetch") !== null ||
    requestHeaders.get("purpose") === "prefetch";
  if (!isPrefetch) {
    await Promise.all(
      fromOffice
        .filter((file) => file.readAt === "" && !hasAttachment(file))
        .map((file) => markFileRead(file.id)),
    );
  }

  return (
    <div className="portal-grid">
      <div className="portal-card is-wide">
        <h2>
          Ofisten gelenler
          <a href="#yeni-mesaj" className="portal-link" style={{ marginLeft: 14, fontSize: "0.95rem" }}>
            Ofise mesaj yaz ↓
          </a>
        </h2>
        {fromOffice.length === 0 ? (
          <p>Ofis henüz size mesaj ya da belge göndermedi.</p>
        ) : (
          <ul className="portal-list">
            {fromOffice.map((file) => (
              <li key={file.id} id={`m-${file.id}`}>
                <span>
                  <strong>{file.title}</strong>{" "}
                  {file.readAt === "" ? <span className="portal-badge is-new">Yeni</span> : null}
                  {file.body ? <div className="portal-body">{file.body}</div> : null}
                  <div className="portal-meta">
                    Kimden: Ofis · {formatDateTime(file.createdAt)}
                    {hasAttachment(file)
                      ? ` · Ek: ${file.originalName} (${formatSize(file.size)})`
                      : ""}
                  </div>
                </span>
                <div className="row-actions">
                  {hasAttachment(file) ? (
                    <a
                      href={`/mukellef/dosya/${file.id}`}
                      className="btn btn-secondary"
                      style={{ padding: "0.4rem 0.8rem" }}
                    >
                      Eki indir
                    </a>
                  ) : null}
                  <form action={hideOfficeMessageAction.bind(null, file.id)}>
                    <ConfirmButton
                      message="Bu mesaj sizin listenizden silinsin mi? Ofisteki kayıt silinmez."
                      className="btn btn-secondary"
                      style={{ padding: "0.4rem 0.8rem" }}
                    >
                      Sil
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="portal-card is-wide" id="yeni-mesaj">
        <h2>Ofise mesaj gönder</h2>
        <p>
          Bir başlık yazın, isterseniz açıklama ve dosya ekleyin; ek zorunlu değildir. Dosya en
          fazla {formatSize(maxUploadBytes())}, kabul edilenler: {ALLOWED_EXTENSIONS_LABEL}. Birden
          fazla dosyayı tek ZIP içinde gönderebilirsiniz.
        </p>
        <PortalForm
          action={sendClientMessageAction}
          submitLabel="Ofise gönder"
          pendingLabel="Gönderiliyor..."
          resetOnSuccess
        >
          <label>
            Başlık
            <input name="title" required maxLength={120} placeholder="Örn. Ekim ayı satış faturaları" />
          </label>
          <label>
            Açıklama
            <textarea
              name="body"
              rows={4}
              maxLength={MESSAGE_BODY_MAX}
              placeholder="Ofise iletmek istediğiniz not (isteğe bağlı)"
            />
          </label>
          <label>
            Ek dosya (isteğe bağlı)
            <input name="file" type="file" />
          </label>
          {open.length > 0 ? (
            <label>
              Bu dosya hangi eksik belge için?
              <select name="requestId" defaultValue="">
                <option value="">Belirli bir talep için değil</option>
                {open.map((request) => (
                  <option key={request.id} value={request.id}>
                    {request.period ? `${formatPeriod(request.period)} — ` : ""}{request.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </PortalForm>
      </div>

      <div className="portal-card is-wide">
        <h2>Gönderdiklerim</h2>
        {mine.length === 0 ? (
          <p>Henüz mesaj göndermediniz.</p>
        ) : (
          <ul className="portal-list">
            {mine.map((file) => (
              <li key={file.id}>
                <span>
                  <strong>{file.title}</strong>
                  {file.body ? <div className="portal-body">{file.body}</div> : null}
                  <div className="portal-meta">
                    Kime: Ofis · {formatDateTime(file.createdAt)}
                    {hasAttachment(file)
                      ? ` · Ek: ${file.originalName} (${formatSize(file.size)})`
                      : ""}
                  </div>
                </span>
                {file.readAt ? (
                  <span className="portal-badge is-ok">Ofis gördü</span>
                ) : (
                  <span className="portal-badge">İletildi</span>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="portal-note">
          Yanlış bir şey gönderdiyseniz ofisle iletişime geçin; ofis silebilir.
        </p>
      </div>
    </div>
  );
}
