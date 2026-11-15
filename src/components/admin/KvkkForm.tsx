"use client";

import { useActionState } from "react";
import { updateKvkkAction, type PageState } from "@/app/actions/pages";
import { KVKK_FIELDS, type KvkkInfo } from "@/lib/kvkk-fields";

const initial: PageState = {};

export function KvkkForm({ info }: { info: KvkkInfo }) {
  const [state, action, pending] = useActionState(updateKvkkAction, initial);

  return (
    <form action={action} className="admin-form">
      {KVKK_FIELDS.map((field) => (
        <div key={field.key} className="admin-field">
          <label>
            {field.label}
            {field.kind === "textarea" ? (
              <textarea
                name={field.key}
                rows={4}
                maxLength={field.maxLength}
                defaultValue={info[field.key]}
                placeholder={field.placeholder}
              />
            ) : (
              <input
                name={field.key}
                maxLength={field.maxLength}
                defaultValue={info[field.key]}
                placeholder={field.placeholder}
              />
            )}
          </label>
          {field.hint ? <p className="form-hint">{field.hint}</p> : null}
        </div>
      ))}
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.success ? <p className="form-success">{state.success}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
