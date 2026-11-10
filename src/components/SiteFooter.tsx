import Link from "next/link";
import type { SiteSettings } from "@/lib/settings";
import { SocialLinks } from "./SocialLinks";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <p className="footer-brand">{settings.siteTitle}</p>
          <p className="footer-text">
            Şirketlerin ve serbest meslek sahiplerinin vergi, muhasebe ve
            danışmanlık ihtiyaçları için güvenilir çözüm ortağı.
          </p>
          <SocialLinks settings={settings} variant="light" />
        </div>
        <div>
          <p className="footer-heading">Hızlı Bağlantılar</p>
          <div className="footer-links">
            <Link href="/hakkimizda">Hakkımızda</Link>
            <Link href="/hizmetler">Hizmetler</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/yararli-linkler">Yararlı Linkler</Link>
            <Link href="/iletisim">İletişim</Link>
          </div>
        </div>
        <div>
          <p className="footer-heading">İletişim</p>
          <p className="footer-text">info@ornek-mm.com</p>
          <p className="footer-text">+90 (212) 000 00 00</p>
          <p className="footer-text">İstanbul, Türkiye</p>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>
          © {new Date().getFullYear()} {settings.siteTitle}. Tüm hakları
          saklıdır.
        </p>
      </div>
    </footer>
  );
}
