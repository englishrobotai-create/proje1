import type { ComponentType, ReactNode } from "react";
import type { IconProps } from "@/components/Icons";

export function SectionHeading({
  title,
  action,
  icon: Icon,
}: {
  title: string;
  action?: ReactNode;
  icon?: ComponentType<IconProps>;
}) {
  return (
    <div className="section-head">
      <div className="section-head-title">
        {Icon ? (
          <span className="sc-tile sc-tile-sm" aria-hidden="true">
            <Icon size={18} />
          </span>
        ) : null}
        <h2 className="section-heading-label">{title}</h2>
      </div>
      {action ? <div className="section-heading-action">{action}</div> : null}
    </div>
  );
}
