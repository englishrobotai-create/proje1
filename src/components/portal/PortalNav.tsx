"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/mukellef", label: "Özet" },
  { href: "/mukellef/belgeler", label: "Mesajlar" },
  { href: "/mukellef/ekstre", label: "Hesap ekstresi" },
];

export function PortalNav() {
  const pathname = usePathname();
  return (
    <nav className="portal-nav" aria-label="Mükellef Köşesi menüsü">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={pathname === item.href ? "is-active" : undefined}
          aria-current={pathname === item.href ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
