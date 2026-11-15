import Link from "next/link";
import { getPortalSession } from "@/lib/portal-auth";
import { ledgerBalance, listDocRequests, listFilesForClient, listLedger } from "@/lib/portal-db";
import {
  describeBalance,
  formatDateTime,
  formatPeriod,
  hasAttachment,
} from "@/lib/portal-shared";

export default async function PortalHomePage() {
  const session = await getPortalSession();
  if (!session) return null; // düzen zaten yönlendirir

  const [requests, files, ledger] = await Promise.all([
    listDocRequests(session.id),
    listFilesForClient(session.id),
    listLedger(session.id),
  ]);
  const open = requests.filter((request) => request.status === "open");
  const fromOffice = files.filter((file) => file.direction === "from_office");
  const unread = fromOffice.filter((file) => file.readAt === "").length;
  const balance = ledgerBalance(ledger);

  return (
    <div className="portal-grid">
      <div className="portal-card">
        <h2>Eksik belgeler</h2>
        {open.length === 0 ? (
          <p>Şu an sizden beklenen bir belge yok.</p>
        ) : (
          <>
            <p>
              Ofisin sizden beklediği <strong>{open.length}</strong> belge var.
            </p>
            <ul className="portal-list" style={{ margin: "0.5rem 0 1rem" }}>
              {open.map((request) => (
                <li key={request.id}>
                  <span>
                    {request.title}
                    {request.period ? (
                      <span className="portal-meta"> · {formatPeriod(request.period)}</span>
                    ) : null}
                    {request.note ? <span className="portal-meta"> — {request.note}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/mukellef/belgeler" className="btn btn-primary">
              Belge gönder
            </Link>
          </>
        )}
      </div>

      <div className="portal-card">
        <h2>Hesap ekstresi</h2>
        <p className={`portal-balance${balance > 0 ? " is-debt" : ""}`}>{describeBalance(balance)}</p>
        <p className="portal-note">
          Ofisin size kestiği ücret ve yaptığınız ödemelerin özetidir; bilgi amaçlıdır.
        </p>
        <Link href="/mukellef/ekstre" className="btn btn-secondary">
          Ekstreyi gör
        </Link>
      </div>

      <div className="portal-card is-wide">
        <h2>
          Ofisten gelenler
          {unread > 0 ? (
            <span className="portal-badge is-new" style={{ marginLeft: 10 }}>
              {unread} yeni
            </span>
          ) : null}
        </h2>
        {fromOffice.length === 0 ? (
          <p>Ofis henüz size mesaj ya da belge göndermedi.</p>
        ) : (
          <>
            <ul className="portal-list">
              {fromOffice.slice(0, 5).map((file) => (
                <li key={file.id}>
                  <span>
                    <strong>{file.title}</strong>{" "}
                    {file.readAt === "" ? <span className="portal-badge is-new">Yeni</span> : null}
                    <div className="portal-meta">
                      {formatDateTime(file.createdAt)}
                      {hasAttachment(file) ? " · ek dosya var" : ""}
                    </div>
                  </span>
                  <Link
                    href={`/mukellef/belgeler#m-${file.id}`}
                    className="btn btn-secondary"
                    style={{ padding: "0.4rem 0.8rem" }}
                  >
                    Oku
                  </Link>
                </li>
              ))}
            </ul>
            {fromOffice.length > 5 ? <Link href="/mukellef/belgeler">Tümünü gör →</Link> : null}
          </>
        )}
      </div>
    </div>
  );
}
