import Link from "next/link";
import type { ComponentType, CSSProperties } from "react";
import {
  IconArrow,
  IconCalculator,
  IconCalendar,
  IconExternal,
  IconFile,
  type IconProps,
} from "@/components/Icons";
import { serviceGlyph, toneAt, type Tone } from "@/components/ServiceIcon";

/** Giriş animasyonunda sütun sırasına göre kademe. */
function stagger(index: number, per = 4): CSSProperties {
  return { "--i": index % per } as CSSProperties;
}

export function ServiceCard({
  title,
  description,
  index,
  per = 4,
}: {
  title: string;
  description: string;
  index: number;
  per?: number;
}) {
  return (
    <article
      className={`sc-card service-card tone-${toneAt(index)}`}
      data-tilt
      data-reveal
      style={stagger(index, per)}
    >
      <span className="sc-tile sc-tile-lg" aria-hidden="true">
        {serviceGlyph(title, 26)}
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="sc-ghost" aria-hidden="true">
        {serviceGlyph(title, 112)}
      </span>
    </article>
  );
}

export function FeatureCard({
  icon: Icon,
  tone,
  title,
  text,
  index,
}: {
  icon: ComponentType<IconProps>;
  tone: Tone;
  title: string;
  text: string;
  index: number;
}) {
  return (
    <article
      className={`sc-card feature-card tone-${tone}`}
      data-tilt
      data-reveal
      style={stagger(index, 3)}
    >
      <div className="feature-head">
        <span className="sc-tile sc-tile-sm feature-tile" aria-hidden="true">
          <Icon size={20} />
        </span>
        <h3>{title}</h3>
      </div>
      <p>{text}</p>
      <span className="sc-ghost" aria-hidden="true">
        <Icon size={96} />
      </span>
    </article>
  );
}

export function PostCard({
  href,
  title,
  excerpt,
  dateISO,
  dateLabel,
  index,
}: {
  href: string;
  title: string;
  excerpt: string;
  dateISO: string;
  dateLabel: string;
  index: number;
}) {
  return (
    <article
      className={`sc-card post-card tone-${toneAt(index + 1)}`}
      data-tilt
      data-reveal
      style={stagger(index, 3)}
    >
      <div className="post-cover" aria-hidden="true">
        <span className="sc-tile sc-tile-sm post-cover-tile">
          <IconFile size={20} />
        </span>
      </div>
      <div className="post-body">
        <time className="post-date" dateTime={dateISO}>
          <IconCalendar size={14} />
          {dateLabel}
        </time>
        <h3>
          <Link href={href}>{title}</Link>
        </h3>
        <p>{excerpt}</p>
        <span className="sc-more" aria-hidden="true">
          Yazıyı oku
          <IconArrow size={16} />
        </span>
      </div>
    </article>
  );
}

export function ToolCard({
  href,
  title,
  description,
  index,
  icon: Icon = IconCalculator,
  cta,
}: {
  href: string;
  title: string;
  description: string;
  index: number;
  icon?: ComponentType<IconProps>;
  cta?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`sc-card tool-card tone-${toneAt(index)}`}
      data-tilt
      data-reveal
      style={stagger(index, 4)}
    >
      <span className="tool-top">
        <span className="sc-tile sc-tile-sm" aria-hidden="true">
          <Icon size={20} />
        </span>
        <strong>{title}</strong>
        <IconExternal size={16} className="tool-ext" />
      </span>
      <span className="tool-desc">{description}</span>
      {cta ? (
        <span className="sc-more">
          {cta}
          <IconArrow size={16} />
        </span>
      ) : null}
    </a>
  );
}
