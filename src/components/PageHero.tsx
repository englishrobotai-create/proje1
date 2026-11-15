import type { ComponentType, ReactNode } from "react";
import { IconBriefcase, type IconProps } from "@/components/Icons";
import { Seal } from "@/components/Seal";

type PageHeroProps = {
  kicker?: ReactNode;
  title: string;
  description: string;
  icon?: ComponentType<IconProps>;
};

export function PageHero({ kicker, title, description, icon: Icon = IconBriefcase }: PageHeroProps) {
  return (
    <div className="page-hero-banner">
      <div className="page-hero-glow" aria-hidden="true" />
      <div className="page-hero-art" aria-hidden="true">
        <Seal className="page-hero-seal" />
        <span className="page-hero-sheet sheet-a" />
        <span className="page-hero-sheet sheet-b" />
        <span className="sc-tile sc-tile-xl page-hero-tile">
          <Icon size={38} />
        </span>
      </div>
      <div className="container page-hero-inner">
        {kicker ? <p className="section-kicker">{kicker}</p> : null}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}
