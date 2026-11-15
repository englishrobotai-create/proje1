"use client";

import { useActionState } from "react";
import {
  createServiceAction,
  updateServiceAction,
  type ServiceState,
} from "@/app/actions/services";

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

export function ServiceForm({ mode, serviceId, defaults }: ServiceFormProps) {
  const action =
    mode === "edit" && serviceId
      ? updateServiceAction.bind(null, serviceId)
      : createServiceAction;

  const [state, formAction, pending] = useActionState(action, initial);

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
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Kaydediliyor..." : mode === "edit" ? "Güncelle" : "Ekle"}
      </button>
    </form>
  );
}
