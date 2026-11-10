import Link from "next/link";

const links = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/hizmetler", label: "Hizmetler" },
  { href: "/blog", label: "Blog" },
  { href: "/iletisim", label: "İletişim" },
];

export function SiteHeader({ siteTitle }: { siteTitle: string }) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          {siteTitle}
        </Link>
        <nav className="nav" aria-label="Ana menü">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link">
              {link.label}
            </Link>
          ))}
        </nav>
        <Link href="/iletisim" className="btn btn-primary header-cta">
          Randevu Alın
        </Link>
      </div>
    </header>
  );
}
