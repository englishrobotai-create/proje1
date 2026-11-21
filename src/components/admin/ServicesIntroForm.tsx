"use client";

import { useActionState, useState } from "react";
import {
  updateServicesIntroAction,
  type ServiceState,
} from "@/app/actions/services";
import { SeoCheckPanel } from "@/components/admin/SeoCheckPanel";
import { checkServicesIntroSeo, type SeoCheckResult } from "@/lib/seo-check";

const initial: ServiceState = {};

function field(form: HTMLFormElement, name: string): string {
  const value = new FormData(form).get(name);
  return typeof value === "string" ? value : "";
}

export function ServicesIntroForm({ intro }: { intro: string }) {
  const [state, action, pending] = useActionState(
    updateServicesIntroAction,
    initial,
  );
  const [seo, setSeo] = useState<SeoCheckResult | null>(null);

  return (
    <form action={action} className="admin-form">
      <label>
        Sayfa üst açıklaması
        <textarea
          name="servicesIntro"
          required
          minLength={10}
          maxLength={400}
          rows={3}
          defaultValue={intro}
        />
      </label>
      <p className="form-hint" style={{ margin: "-0.5rem 0 0" }}>
        Hizmetler sayfasının üst metni ve arama motoru açıklaması bu alandan
        gelir.
      </p>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <SeoCheckPanel result={seo} />
      <div className="admin-form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={(event) => {
            const form = event.currentTarget.form;
            if (!form) return;
            setSeo(
              checkServicesIntroSeo({ intro: field(form, "servicesIntro") }),
            );
          }}
        >
          SEO kontrolü yap
        </button>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Kaydediliyor..." : "Açıklamayı Kaydet"}
        </button>
      </div>
    </form>
  );
}
