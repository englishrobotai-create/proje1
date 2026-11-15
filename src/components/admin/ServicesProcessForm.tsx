"use client";

import { useActionState } from "react";
import {
  updateServicesProcessAction,
  type ServiceState,
} from "@/app/actions/services";

const initial: ServiceState = {};

export function ServicesProcessForm({ process }: { process: string }) {
  const [state, action, pending] = useActionState(
    updateServicesProcessAction,
    initial,
  );

  return (
    <form action={action} className="admin-form">
      <label>
        Nasıl çalışıyoruz (adımlar)
        <textarea
          name="servicesProcess"
          required
          minLength={5}
          maxLength={1500}
          rows={8}
          defaultValue={process}
        />
      </label>
      <p className="form-hint">
        Her satıra bir adım yazın; başlığı ve açıklamayı dikey çizgiyle (
        <strong>|</strong>) ayırın. Örnek:{" "}
        <em>Tanışma | İhtiyaçlarınızı birlikte netleştiririz.</em> En fazla 8
        adım gösterilir. Bu metni kendi çalışma düzeninize göre düzenleyin.
      </p>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Kaydediliyor..." : "Adımları Kaydet"}
      </button>
    </form>
  );
}
