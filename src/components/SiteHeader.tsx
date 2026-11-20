"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  IconBook,
  IconBriefcase,
  IconCalendarCheck,
  IconClock,
  IconHome,
  IconLock,
  IconMail,
  IconPhone,
  IconUser,
} from "@/components/Icons";
import { toneAt } from "@/components/ServiceIcon";
import type { SiteSettings } from "@/lib/settings";

const links = [
  { href: "/", label: "Ana Sayfa", Icon: IconHome },
  { href: "/hakkimizda", label: "Hakkımda", Icon: IconUser },
  { href: "/hizmetler", label: "Hizmetler", Icon: IconBriefcase },
  { href: "/blog", label: "Blog", Icon: IconBook },
  { href: "/iletisim", label: "İletişim", Icon: IconMail },
];

export function SiteHeader({
  settings,
  logoSrc,
  portalEnabled = false,
}: {
  settings: SiteSettings;
  /** Üst menü logosu (`/logo?v=` veya varsayılan `/smmm.png`). */
  logoSrc: string;
  portalEnabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const navLinks = portalEnabled
    ? [...links, { href: "/mukellef", label: "Mükellef Girişi", Icon: IconLock }]
    : links;
  const phoneHref = `tel:${settings.contactPhone.replace(/[^+\d]/g, "")}`;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="header-top">
        <div className="container header-top-inner">
          <a href={phoneHref} className="ht-item">
            <IconPhone size={14} />
            {settings.contactPhone}
          </a>
          <span className="ht-item">
            <IconClock size={14} />
            {settings.contactHours}
          </span>
        </div>
      </div>
      <div className="container header-inner">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <span className="brand-mark" aria-hidden="true">
            <Image
              src={logoSrc}
              alt=""
              width={40}
              height={40}
              className="brand-logo"
              unoptimized={logoSrc.startsWith("/logo")}
              priority
            />
          </span>
          <span className="brand-text">{settings.siteTitle}</span>
        </Link>
        <nav className="nav" aria-label="Ana menü">
          {navLinks.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            const portal = link.href === "/mukellef";
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link${active ? " is-active" : ""}${portal ? " is-portal" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {portal ? <link.Icon size={15} /> : null}
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="header-right">
          <Link href="/iletisim" className="btn btn-primary header-cta">
            <IconCalendarCheck size={17} />
            Randevu Alın
          </Link>
          <button
            type="button"
            className={`menu-toggle${open ? " is-open" : ""}`}
            aria-expanded={open}
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
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
          {navLinks.map((link, index) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`mobile-link${active ? " is-active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <span className={`sc-tile sc-tile-sm tone-${toneAt(index)}`} aria-hidden="true">
                  <link.Icon size={18} />
                </span>
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/iletisim"
            className="btn btn-primary"
            onClick={() => setOpen(false)}
          >
            <IconCalendarCheck size={17} />
            Randevu Alın
          </Link>
        </div>
      ) : null}
    </header>
  );
}
