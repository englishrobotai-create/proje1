import { IconId } from "@/components/Icons";
import { SectionHeading } from "@/components/SectionHeading";
import {
  professionalRows,
  type ProfessionalInfo,
} from "@/lib/professional-fields";

/** Hakkımda sayfasında tam liste. Hiç alan doluysa görünür. */
export function ProfessionalInfoSection({ info }: { info: ProfessionalInfo }) {
  const rows = professionalRows(info);
  if (rows.length === 0) return null;

  return (
    <section className="section">
      <div className="container">
        <SectionHeading title="Mesleki bilgiler" icon={IconId} />
        <dl className="pro-info-list">
          {rows.map((row, index) => (
            <div
              className={`sc-card pro-info-item tone-${["blue", "green", "amber", "red"][index % 4]}`}
              key={row.key}
              data-reveal
              style={{ "--i": index % 3 } as React.CSSProperties}
            >
              <span className="sc-tile sc-tile-sm" aria-hidden="true">
                <IconId size={17} />
              </span>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** İletişim sayfasındaki koyu yan panelin altına eklenen satırlar. */
export function ProfessionalInfoAside({ info }: { info: ProfessionalInfo }) {
  const rows = professionalRows(info);
  if (rows.length === 0) return null;

  return (
    <>
      <h3 className="aside-subtitle">Mesleki bilgiler</h3>
      {rows.map((row) => (
        <div className="contact-detail" key={row.key}>
          <span>{row.label}</span>
          <strong>{row.value}</strong>
        </div>
      ))}
    </>
  );
}
