import Link from "next/link";
import type { ReactNode } from "react";

/** Mükellef yönetim sayfalarında ortak küçük parçalar (sunucu bileşenleri). */

export function StatTiles({ children }: { children: ReactNode }) {
  return <div className="portal-stats">{children}</div>;
}

export function StatTile({
  label,
  value,
  hint,
  attention = false,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  /** Dikkat isteyen sayı (sıfırdan büyük bekleyen iş) kırmızı vurgulanır. */
  attention?: boolean;
}) {
  return (
    <div className={`portal-stat${attention ? " is-attention" : ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </div>
  );
}

/** "Şimdi ne yapmalıyım?" kutusu: tek cümlelik öneri ve isteğe bağlı kısayol düğmesi. */
export function NextStep({
  children,
  href,
  linkLabel,
}: {
  children: ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="portal-next" role="note">
      <div>
        <strong>Sıradaki adım</strong>
        <p>{children}</p>
      </div>
      {href && linkLabel ? (
        <Link href={href} className="btn btn-primary">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
