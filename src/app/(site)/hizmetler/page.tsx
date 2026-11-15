import type { Metadata } from "next";
import { ServiceCard } from "@/components/Cards";
import { IconBriefcase } from "@/components/Icons";
import { JsonLd } from "@/components/JsonLd";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { prisma } from "@/lib/db";
import { organizationRef, pageMetadata } from "@/lib/seo";
import { getServicesProcess, parseProcessSteps } from "@/lib/services-process";
import { getSiteSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return pageMetadata(settings, {
    title: "Hizmetler",
    description: settings.servicesIntro,
    path: "/hizmetler",
  });
}

export default async function ServicesPage() {
  const [settings, services, processText] = await Promise.all([
    getSiteSettings(),
    prisma.service.findMany({ orderBy: { sortOrder: "asc" } }),
    getServicesProcess(),
  ]);

  const provider = organizationRef(settings);
  const steps = parseProcessSteps(processText);

  return (
    <>
      {services.length > 0 ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": services.map((service) => ({
              "@type": "Service",
              name: service.title,
              serviceType: service.title,
              description: service.description,
              provider,
            })),
          }}
        />
      ) : null}
      <PageHero
        title="Hizmetler"
        description={settings.servicesIntro}
        icon={IconBriefcase}
      />
      <section className="section">
        <div className="container sc-grid sc-grid-3">
          {services.length === 0 ? (
            <article className="sc-card tone-blue" data-reveal>
              <h3>Hizmetler yakında</h3>
              <p>Hizmet listemiz çok yakında burada yer alacak.</p>
            </article>
          ) : (
            services.map((service, index) => (
              <ServiceCard
                key={service.id}
                title={service.title}
                description={service.description}
                index={index}
                per={3}
              />
            ))
          )}
        </div>
      </section>

      {steps.length > 0 ? (
        <section className="section process-section">
          <div className="container">
            <SectionHeading title="Nasıl çalışıyoruz" />
            <ol className="process-list">
              {steps.map((step, index) => (
                <li
                  key={step.title}
                  className={`process-step sc-card tone-${["blue", "green", "amber", "red"][index % 4]}`}
                  data-reveal
                  data-tilt
                  style={{ "--i": index % 4 } as React.CSSProperties}
                >
                  <span className="step-num sc-tile sc-tile-lg" aria-hidden="true">
                    {index + 1}
                  </span>
                  <h3>{step.title}</h3>
                  {step.text ? <p>{step.text}</p> : null}
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}
    </>
  );
}
