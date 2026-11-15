import { getPortalSession } from "@/lib/portal-auth";
import { ledgerBalance, listLedger, withRunningBalance } from "@/lib/portal-db";
import { describeBalance, formatDateOnly, formatKurus } from "@/lib/portal-shared";

export default async function PortalLedgerPage() {
  const session = await getPortalSession();
  if (!session) return null;

  const ledger = await listLedger(session.id);
  const lines = withRunningBalance(ledger);
  const balance = ledgerBalance(ledger);

  return (
    <div className="portal-card">
      <h2>Hesap ekstresi</h2>
      <p className={`portal-balance${balance > 0 ? " is-debt" : ""}`}>{describeBalance(balance)}</p>
      {lines.length === 0 ? (
        <p>Henüz bir hesap hareketi yok.</p>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="portal-note">
        Bu döküm bilgi amaçlıdır; fatura veya makbuz yerine geçmez. Farklı gördüğünüz bir kayıt varsa
        ofisle iletişime geçin.
      </p>
    </div>
  );
}
