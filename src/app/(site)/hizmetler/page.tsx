import type { Metadata } from "next";
import { PageHero } from "@/components/PageHero";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Hizmetler",
};

export default async function ServicesPage() {
  const [settings, services] = await Promise.all([
    getSiteSettings(),
    prisma.service.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <PageHero
        kicker="Hizmet portföyü"
        title="Hizmetler"
        description={settings.servicesIntro}
      />
      <section className="section">
        <div className="container service-grid">
          {services.length === 0 ? (
            <article className="service-item">
              <h3>Hizmetler yakında</h3>
              <p>Admin panelinden hizmet ekleyebilirsiniz.</p>
            </article>
          ) : (
            services.map((service, index) => (
              <article key={service.id} className="service-item">
                <div className="feature-icon">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </>
  );
}
