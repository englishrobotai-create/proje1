"use client";

import type { CSSProperties, ReactNode } from "react";

/** Silme gibi geri alınamaz işlemlerde göndermeden önce onay ister. */
export function ConfirmButton({
  message,
  children,
  className,
  style,
}: {
  message: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      type="submit"
      className={className}
      style={style}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
