import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import {
  usefulLinkCount,
  usefulLinkGroups,
} from "@/data/useful-links";

export const metadata: Metadata = {
  title: "Yararlı Linkler",
  description:
    "Vergi, SGK, e-Devlet ve mali müşavirlik için sık kullanılan resmi kaynaklar.",
};

export default function UsefulLinksPage() {
  return (
    <>
      <PageHero
        kicker="Kaynak merkezi"
        title="Yararlı Linkler"
        description={`Mali müşavirlik süreçlerinde sık kullanılan ${usefulLinkCount} resmi ve sektörel kaynağı tek sayfada topladık.`}
      />
      <section className="section">
        <div className="container link-groups">
          {usefulLinkGroups.map((group) => (
            <section key={group.category} className="link-group">
              <div className="link-group-head">
                <h2>{group.category}</h2>
                <span>{group.links.length} link</span>
              </div>
              <div className="useful-link-grid">
                {group.links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="useful-link-card"
                  >
                    <strong>{link.title}</strong>
                    <span>{link.description}</span>
                    <em>Siteye git →</em>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
