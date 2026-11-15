import type { Metadata } from "next";
import { ToolCard } from "@/components/Cards";
import {
  IconBank,
  IconBook,
  IconBuilding,
  IconGlobe,
  IconLink,
  IconPercent,
  IconUsers,
  type IconProps,
} from "@/components/Icons";
import { PageHero } from "@/components/PageHero";
import {
  usefulLinkCount,
  usefulLinkGroups,
} from "@/data/useful-links";
import { pageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return pageMetadata(settings, {
    title: "Yararlı Linkler",
    description:
      "Vergi, SGK, e-Devlet ve mali müşavirlik için sık kullanılan resmi kaynaklar.",
    path: "/yararli-linkler",
  });
}

const categoryIcons: { match: RegExp; icon: React.ComponentType<IconProps> }[] = [
  { match: /vergi|gelir/i, icon: IconPercent },
  { match: /sgk|çalışma/i, icon: IconUsers },
  { match: /devlet|resmi/i, icon: IconGlobe },
  { match: /banka|finans/i, icon: IconBank },
  { match: /meslek|sektör/i, icon: IconBook },
  { match: /şirket|teşvik/i, icon: IconBuilding },
];

function categoryIcon(category: string) {
  return categoryIcons.find((item) => item.match.test(category))?.icon ?? IconLink;
}

export default function UsefulLinksPage() {
  return (
    <>
      <PageHero
        title="Yararlı Linkler"
        description={`Mali müşavirlik süreçlerinde sık kullanılan ${usefulLinkCount} resmi ve sektörel kaynağı tek sayfada topladık.`}
        icon={IconLink}
      />
      <section className="section">
        <div className="container link-groups">
          {usefulLinkGroups.map((group, groupIndex) => {
            const Icon = categoryIcon(group.category);
            return (
              <section key={group.category} className="link-group">
                <div className="link-group-head">
                  <span className="sc-tile sc-tile-sm" aria-hidden="true">
                    <Icon size={18} />
                  </span>
                  <h2>{group.category}</h2>
                  <span className="link-count">{group.links.length} link</span>
                </div>
                <div className="sc-grid sc-grid-3">
                  {group.links.map((link, index) => (
                    <ToolCard
                      key={link.href}
                      href={link.href}
                      title={link.title}
                      description={link.description}
                      index={groupIndex + index}
                      icon={Icon}
                      cta="Siteye git"
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>
    </>
  );
}
