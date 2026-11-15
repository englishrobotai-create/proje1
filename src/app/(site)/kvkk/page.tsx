import type { Metadata } from "next";
import { IconShieldCheck } from "@/components/Icons";
import { PageHero } from "@/components/PageHero";
import { getKvkkInfo } from "@/lib/kvkk-info";
import {
  buildKvkkTemplate,
  kvkkTemplateInput,
  parseLegalText,
} from "@/lib/kvkk-text";
import { pageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

const DESCRIPTION =
  "Görüşme talebi formunu kullanırken kişisel verilerinizin nasıl işlendiğini ve haklarınızı açıklar.";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return pageMetadata(settings, {
    title: "KVKK Aydınlatma Metni",
    description: DESCRIPTION,
    path: "/kvkk",
  });
}

export default async function KvkkPage() {
  const [settings, info] = await Promise.all([getSiteSettings(), getKvkkInfo()]);

  // Yönetici metni kendisi yazdıysa o gösterilir; yoksa şablon.
  const text =
    info.customText || buildKvkkTemplate(kvkkTemplateInput(settings, info));
  const blocks = parseLegalText(text);

  return (
    <>
      <PageHero title="KVKK Aydınlatma Metni" description={DESCRIPTION} icon={IconShieldCheck} />
      <section className="section">
        <div className="container">
          <article className="legal-text">
            {blocks.map((block, index) => {
              if (block.type === "h") return <h2 key={index}>{block.text}</h2>;
              if (block.type === "ul") {
                return (
                  <ul key={index}>
                    {block.items.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                );
              }
              return <p key={index}>{block.text}</p>;
            })}
          </article>
        </div>
      </section>
    </>
  );
}
