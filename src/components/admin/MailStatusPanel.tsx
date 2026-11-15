"use client";

import { useActionState } from "react";
import { sendTestMailAction, type ContactState } from "@/app/actions/messages";

const initial: ContactState = {};

export function MailStatusPanel({
  ready,
  detail,
}: {
  ready: boolean;
  detail: string;
}) {
  const [state, action, pending] = useActionState(sendTestMailAction, initial);

  return (
    <div className={`admin-panel mail-status ${ready ? "is-on" : "is-off"}`}>
      <p>{detail}</p>
      {ready ? (
        <form action={action} className="mail-status-state">
          <button type="submit" className="btn btn-secondary" disabled={pending}>
            {pending ? "Gönderiliyor..." : "Test e-postası gönder"}
          </button>
          {state.error ? <span className="form-error">{state.error}</span> : null}
          {state.success ? (
            <span className="form-success">{state.success}</span>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
