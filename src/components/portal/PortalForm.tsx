"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import type { PortalState } from "@/lib/portal-shared";

type Props = {
  action: (prev: PortalState, formData: FormData) => Promise<PortalState>;
  children: ReactNode;
  submitLabel: string;
  pendingLabel?: string;
  /** Başarılı olunca alanları temizler (belge yükleme, kayıt ekleme gibi tekrarlı formlar). */
  resetOnSuccess?: boolean;
  className?: string;
  buttonClassName?: string;
};

/**
 * Sunucu işlemlerini elle çağıran genel form. React 19'un `action={...}` formu her sonuçta
 * sıfırlaması (hatalarda yazılanı da silmesi) yüzünden bilerek `onSubmit` kullanılır: hata olursa
 * yazılanlar yerinde kalır, yalnızca başarıda (isteğe bağlı) temizlenir.
 */
export function PortalForm({
  action,
  children,
  submitLabel,
  pendingLabel = "Kaydediliyor...",
  resetOnSuccess = false,
  className = "admin-form",
  buttonClassName = "btn btn-primary",
}: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<PortalState>({});
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setState({});
    startTransition(async () => {
      try {
        const result = (await action({}, data)) ?? {};
        setState(result);
        if (result.success) {
          if (resetOnSuccess) formRef.current?.reset();
          router.refresh();
        }
      } catch {
        setState({
          error:
            "İşlem tamamlanamadı. Dosya boyutunu ve internet bağlantınızı kontrol edip tekrar deneyin.",
        });
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      // Kullanıcı yeni bir şey yazmaya başlayınca eski sonuç mesajı kalkar (bağlantı kutusu kalır).
      onInput={() =>
        setState((current) =>
          current.error || current.success ? { link: current.link } : current,
        )
      }
      className={className}
    >
      {children}
      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="form-success" role="status">
          {state.success}
        </p>
      ) : null}
      {state.link ? <LinkBox link={state.link} /> : null}
      <button type="submit" className={buttonClassName} disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}

function LinkBox({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Pano erişimi yoksa kullanıcı alanı seçip kopyalayabilir.
    }
  }

  return (
    <div className="link-box">
      <input
        readOnly
        value={link}
        aria-label="Bağlantı"
        onFocus={(event) => event.currentTarget.select()}
      />
      <button type="button" className="btn btn-secondary" onClick={copy}>
        {copied ? "Kopyalandı" : "Kopyala"}
      </button>
    </div>
  );
}
