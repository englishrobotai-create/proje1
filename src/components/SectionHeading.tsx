import type { ReactNode } from "react";

type Variant = "trust" | "services" | "blog" | "calculators";

const icons: Record<Variant, ReactNode> = {
  trust: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3.25 18.5 6v5.1c0 4.1-2.7 7.8-6.5 9.15C8.2 18.9 5.5 15.2 5.5 11.1V6zM12 5.1 7 7.25v3.85c0 3.15 2.05 6 5 7.1 2.95-1.1 5-3.95 5-7.1V7.25z"
      />
      <path
        fill="currentColor"
        d="M10.7 13.85 8.9 12l-1.05 1.05 2.85 2.85 5.1-5.1-1.05-1.05z"
      />
    </svg>
  ),
  services: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9 3h6a1 1 0 0 1 1 1v2h3.5A1.5 1.5 0 0 1 21 7.5v11A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5v-11A1.5 1.5 0 0 1 4.5 6H8V4a1 1 0 0 1 1-1zm1 3h4V5h-4zm-5.5 3v9.5h15V9z"
      />
      <path
        fill="currentColor"
        d="M8.5 12.25h7a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1 0-1.5zm0 3h4.5a.75.75 0 0 1 0 1.5H8.5a.75.75 0 0 1 0-1.5z"
      />
    </svg>
  ),
  blog: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.5 3.5h8.2L19 7.8V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19V5a1.5 1.5 0 0 1 1.5-1.5zm7.7 1.1v3.2H18zM8.25 11h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5zm0 3.25h7.5a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5zm0 3.25h5a.75.75 0 0 1 0 1.5h-5a.75.75 0 0 1 0-1.5z"
      />
    </svg>
  ),
  calculators: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 3.5h10A1.5 1.5 0 0 1 18.5 5v14A1.5 1.5 0 0 1 17 20.5H7A1.5 1.5 0 0 1 5.5 19V5A1.5 1.5 0 0 1 7 3.5zm1.25 2.25v3h7.5v-3zm1 5.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm3.75 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm3.75 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-7.5 3.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm3.75 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm3.75 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"
      />
    </svg>
  ),
};

export function SectionHeading({
  variant,
  kicker,
  title,
  lead,
  action,
}: {
  variant: Variant;
  kicker: string;
  title: string;
  lead?: string;
  action?: ReactNode;
}) {
  return (
    <div className={`section-head section-heading section-heading-${variant}`}>
      <div className="section-heading-row">
        <span className="section-heading-icon" aria-hidden="true">
          {icons[variant]}
        </span>
        <div className="section-heading-text">
          <span className="section-heading-kicker">{kicker}</span>
          <h2 className="section-title section-heading-title">{title}</h2>
        </div>
        {lead ? <p className="section-lead section-heading-lead">{lead}</p> : null}
        {action ? <div className="section-heading-action">{action}</div> : null}
      </div>
    </div>
  );
}
