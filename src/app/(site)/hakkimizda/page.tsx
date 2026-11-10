import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Hakkımda",
};

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <PageHero
        kicker="Kurumsal profil"
        title="Hakkımda"
        description={settings.aboutIntro}
      />

      <section className="section">
        <div className="container about-layout">
          <article className="about-panel">
            <p className="section-kicker">Yaklaşım</p>
            <h2>{settings.aboutApproachTitle}</h2>
            <p>{settings.aboutApproachText}</p>
          </article>
          <article className="about-panel">
            <p className="section-kicker">Kapsam</p>
            <h2>{settings.aboutScopeTitle}</h2>
            <p>{settings.aboutScopeText}</p>
          </article>
          <article className="about-panel accent">
            <p className="section-kicker">Taahhüt</p>
            <h2>{settings.aboutPromiseTitle}</h2>
            <p>{settings.aboutPromiseText}</p>
          </article>
        </div>
      </section>
    </>
  );
}
