"use client";

import { useActionState } from "react";
import {
  updateServicesIntroAction,
  type ServiceState,
} from "@/app/actions/services";

const initial: ServiceState = {};

export function ServicesIntroForm({ intro }: { intro: string }) {
  const [state, action, pending] = useActionState(
    updateServicesIntroAction,
    initial,
  );

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
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Kaydediliyor..." : "Açıklamayı Kaydet"}
      </button>
    </form>
  );
}
