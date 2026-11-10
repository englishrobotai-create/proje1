"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { SiteSettings } from "@/lib/settings";

const links = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/hizmetler", label: "Hizmetler" },
  { href: "/blog", label: "Blog" },
  { href: "/iletisim", label: "İletişim" },
];

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="header-top">
        <div className="container header-top-inner">
          <span>Mali müşavirlik · Vergi · Danışmanlık</span>
          <span>Hafta içi 09:00 – 18:00</span>
        </div>
      </div>
      <div className="container header-inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark" aria-hidden="true">
            {settings.siteTitle.slice(0, 1)}
          </span>
          <span className="brand-text">{settings.siteTitle}</span>
        </Link>
        <nav className="nav" aria-label="Ana menü">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link${active ? " is-active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="header-right">
          <Link href="/iletisim" className="btn btn-primary header-cta">
            Randevu Alın
          </Link>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-label="Menüyü aç"
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
      {open ? (
        <div className="mobile-menu container">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="mobile-link"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/iletisim"
            className="btn btn-primary"
            onClick={() => setOpen(false)}
          >
            Randevu Alın
          </Link>
        </div>
      ) : null}
    </header>
  );
}
