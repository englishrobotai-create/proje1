import bcrypt from "bcryptjs";
import { getAboutPhoto } from "./about-photo";
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from "./default-admin";
import { prisma } from "./db";
import { getMailStatus, isUsableEmail } from "./mail";
import { getProfessionalInfo } from "./professional-info";
import { CONTACT_PLACEHOLDERS, type SiteSettings } from "./settings";
import { getSiteLogo } from "./site-logo";
import { isRealSocialUrl } from "./social-links";

export type ChecklistItem = {
  id: string;
  title: string;
  /** Madde tamamlanmamışken gösterilen açıklama. */
  detail: string;
  href?: string;
  /** İsteğe bağlı maddeler yayına almayı engellemez; yalnızca öneridir. */
  optional?: boolean;
  done: boolean;
};

/** prisma/seed.ts ile gelen örnek blog yazılarının adresleri. */
const SAMPLE_POST_SLUGS = [
  "2026-vergi-takviminde-dikkat-edilecekler",
  "sirket-kurulusunda-en-sik-yapilan-5-hata",
];

const LOCAL_HOST = /localhost|127\.0\.0\.1|\[::1\]/i;

/**
 * Siteyi yayına almadan önce gözden geçirilmesi gereken yer tutucu ve eksik ayarları denetler.
 * Yalnızca okur; hiçbir veriyi değiştirmez.
 */
export async function getLaunchChecklist(
  settings: SiteSettings,
): Promise<ChecklistItem[]> {
  const [users, samplePosts, aboutPhoto, siteLogo, professional] =
    await Promise.all([
      prisma.user.findMany({ select: { email: true, passwordHash: true } }),
      prisma.post.count({
        where: { slug: { in: SAMPLE_POST_SLUGS }, published: true },
      }),
      getAboutPhoto(),
      getSiteLogo(),
      getProfessionalInfo(),
    ]);

  const passwordChecks = await Promise.all(
    users.map((user) =>
      bcrypt.compare(DEFAULT_ADMIN_PASSWORD, user.passwordHash),
    ),
  );
  const defaultPassword = passwordChecks.some(Boolean);
  const defaultEmail = users.some(
    (user) => user.email.trim().toLowerCase() === DEFAULT_ADMIN_EMAIL,
  );

  let adminDetail = "";
  if (defaultPassword && defaultEmail) {
    adminDetail =
      "Varsayılan e-posta ve şifre (README’de yazılı) hâlâ geçerli. Siteyi yayına almadan önce ikisini de değiştirin.";
  } else if (defaultPassword) {
    adminDetail =
      "Varsayılan şifre (README’de yazılı) hâlâ geçerli. Siteyi yayına almadan önce değiştirin.";
  } else if (defaultEmail) {
    adminDetail = `Giriş e-postası hâlâ varsayılan (${DEFAULT_ADMIN_EMAIL}). Kendi e-postanızla değiştirin.`;
  }

  const placeholderContact: string[] = [];
  if (!isUsableEmail(settings.contactEmail)) placeholderContact.push("e-posta");
  if (settings.contactPhone.trim() === CONTACT_PLACEHOLDERS.phone) {
    placeholderContact.push("telefon");
  }
  if (settings.contactAddress.trim() === CONTACT_PLACEHOLDERS.address) {
    placeholderContact.push("adres");
  }

  const socials = [
    { label: "Facebook", href: settings.facebook },
    { label: "Instagram", href: settings.instagram },
    { label: "LinkedIn", href: settings.linkedin },
    { label: "X (Twitter)", href: settings.twitter },
    { label: "YouTube", href: settings.youtube },
    { label: "WhatsApp", href: settings.whatsapp },
  ];
  const placeholderSocials = socials
    .filter((item) => item.href.trim() && !isRealSocialUrl(item.href))
    .map((item) => item.label);

  const siteUrl = process.env.SITE_URL?.trim() ?? "";
  const mail = getMailStatus(settings);
  const sampleAbout = aboutPhoto.show && aboutPhoto.ext === null;
  const professionalMissing = !professional.chamber.trim() || !professional.registryNo.trim();

  return [
    {
      id: "admin",
      title: "Yönetici e-postası ve şifresi",
      detail: adminDetail,
      href: "/admin/hesap",
      done: !defaultPassword && !defaultEmail,
    },
    {
      id: "title",
      title: "Site başlığı",
      detail: `“${settings.siteTitle}” yer tutucu görünüyor. Kendi adınızı ya da büronuzun adını yazın.`,
      href: "/admin/ayarlar",
      done: !/ad\s*soyad/i.test(settings.siteTitle),
    },
    {
      id: "contact",
      title: "İletişim bilgileri",
      detail: `Yer tutucu duruyor: ${placeholderContact.join(", ")}. Gerçek bilgilerinizi yazın.`,
      href: "/admin/iletisim",
      done: placeholderContact.length === 0,
    },
    {
      id: "posts",
      title: "Örnek blog yazıları",
      detail: `${samplePosts} örnek yazı hâlâ yayında. Silin ya da kendi yazılarınızla değiştirin.`,
      href: "/admin/blog",
      done: samplePosts === 0,
    },
    {
      id: "about-photo",
      title: "Hakkımda fotoğrafı",
      detail:
        "Örnek bir illüstrasyon gösteriliyor. Kendi fotoğrafınızı yükleyin ya da fotoğrafı gizleyin.",
      href: "/admin/hakkimizda",
      done: !sampleAbout,
    },
    {
      id: "site-logo",
      title: "Site logosu",
      detail:
        "Varsayılan logo görünüyor. Kendi logonuzu Admin > Ayarlar’dan yükleyin.",
      href: "/admin/ayarlar",
      optional: true,
      done: Boolean(siteLogo.ext),
    },
    {
      id: "site-url",
      title: "Sitenin yayın adresi",
      detail:
        "Yerel adres (localhost) kullanılıyor. Canlıya alırken sunucudaki .env dosyasında SITE_URL değerine gerçek alan adını yazın.",
      done: Boolean(siteUrl) && !LOCAL_HOST.test(siteUrl),
    },
    {
      id: "professional",
      title: "Mesleki bilgiler",
      detail:
        "Bağlı olduğunuz oda ve oda sicil numarası boş. Sitede gösterilmesi gerekip gerekmediğini odanıza sorun.",
      href: "/admin/iletisim",
      optional: true,
      done: !professionalMissing,
    },
    {
      id: "social",
      title: "Sosyal medya adresleri",
      detail: `Yer tutucu adres: ${placeholderSocials.join(", ")}. Bu simgeler sitede gösterilmez; gerçek adresi yazın ya da platformu kapatın.`,
      href: "/admin/sosyal-medya",
      optional: true,
      done: placeholderSocials.length === 0,
    },
    {
      id: "mail",
      title: "E-posta bildirimi",
      detail: mail.detail,
      href: "/admin/mesajlar",
      optional: true,
      done: mail.ready,
    },
  ];
}
