type PageHeroProps = {
  kicker?: string;
  title: string;
  description: string;
};

export function PageHero({ kicker, title, description }: PageHeroProps) {
  return (
    <div className="page-hero-banner">
      <div className="page-hero-glow" aria-hidden="true" />
      <div className="container page-hero-inner">
        {kicker ? <p className="section-kicker">{kicker}</p> : null}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}
