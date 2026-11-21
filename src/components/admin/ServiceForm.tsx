"use client";

import { useActionState, useState } from "react";
import {
  createServiceAction,
  updateServiceAction,
  type ServiceState,
} from "@/app/actions/services";
import { SeoCheckPanel } from "@/components/admin/SeoCheckPanel";
import { checkServiceSeo, type SeoCheckResult } from "@/lib/seo-check";

const initial: ServiceState = {};

type ServiceFormProps = {
  mode: "create" | "edit";
  serviceId?: string;
  defaults?: {
    title: string;
    description: string;
    sortOrder: number;
  };
};

function field(form: HTMLFormElement, name: string): string {
  const value = new FormData(form).get(name);
  return typeof value === "string" ? value : "";
}

export function ServiceForm({ mode, serviceId, defaults }: ServiceFormProps) {
  const action =
    mode === "edit" && serviceId
      ? updateServiceAction.bind(null, serviceId)
      : createServiceAction;

  const [state, formAction, pending] = useActionState(action, initial);
  const [seo, setSeo] = useState<SeoCheckResult | null>(null);

  return (
    <form action={formAction} className="admin-form">
      <label>
        Hizmet başlığı
        <input
          name="title"
          required
          minLength={2}
          maxLength={100}
          defaultValue={defaults?.title}
        />
      </label>
      <label>
        Açıklama
        <textarea
          name="description"
          required
          minLength={10}
          maxLength={400}
          rows={4}
          defaultValue={defaults?.description}
        />
      </label>
      <p className="form-hint" style={{ margin: "-0.5rem 0 0" }}>
        Bu metin hizmet kartında ve yapılandırılmış veride görünür. Kimler için,
        ne kapsar kısaca yazın.
      </p>
      <label>
        Sıra (küçük sayı önce görünür)
        <input
          name="sortOrder"
          type="number"
          min={0}
          max={999}
          defaultValue={defaults?.sortOrder ?? 0}
        />
      </label>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <SeoCheckPanel result={seo} />
      <div className="admin-form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={(event) => {
            const form = event.currentTarget.form;
            if (!form) return;
            setSeo(
              checkServiceSeo({
                title: field(form, "title"),
                description: field(form, "description"),
              }),
            );
          }}
        >
          SEO kontrolü yap
        </button>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Kaydediliyor..." : mode === "edit" ? "Güncelle" : "Ekle"}
        </button>
      </div>
    </form>
  );
}
