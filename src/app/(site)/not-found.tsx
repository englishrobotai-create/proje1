import { NotFoundContent } from "@/components/NotFoundContent";

// Site sayfalarındaki notFound() çağrıları (örn. olmayan blog yazısı) için.
// Üst menü ve alt bilgiyi (site)/layout.tsx zaten çizer.
export default function SiteNotFound() {
  return <NotFoundContent />;
}
