"use client";

import { useActionState } from "react";
import {
  updateProfessionalInfoAction,
  type PageState,
} from "@/app/actions/pages";
import {
  PROFESSIONAL_FIELDS,
  PROFESSIONAL_MAX_LENGTH,
  type ProfessionalInfo,
} from "@/lib/professional-fields";

const initial: PageState = {};

export function ProfessionalInfoForm({ info }: { info: ProfessionalInfo }) {
  const [state, action, pending] = useActionState(
    updateProfessionalInfoAction,
    initial,
  );

  return (
    <form action={action} className="admin-form">
      <div className="form-row">
        {PROFESSIONAL_FIELDS.map((field) => (
          <label key={field.key}>
            {field.label}
            <input
              name={field.key}
              maxLength={PROFESSIONAL_MAX_LENGTH}
              defaultValue={info[field.key]}
              placeholder={field.placeholder}
            />
          </label>
        ))}
      </div>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Kaydediliyor..." : "Mesleki Bilgileri Kaydet"}
      </button>
    </form>
  );
}
