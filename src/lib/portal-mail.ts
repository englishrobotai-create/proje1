import { getMailConfig, resolveRecipient, sendMailTo } from "./mail";
import { getSiteUrl } from "./seo";
import type { SiteSettings } from "./settings";

/**
 * Mükellef Köşesi e-postaları. Hepsi "elinden geleni yap" türündedir: SMTP kapalıysa ya da
 * gönderim başarısız olursa işlem bozulmaz (çağıranlar `after()` içinde, hataları yutarak çağırır).
 * Güvenlik ve gizlilik gereği e-postalarda dosya adı, tutar ya da belge içeriği YER ALMAZ;
 * yalnızca "yeni bir şey var, giriş yapın" bilgisi gider.
 */

type Settings = Pick<SiteSettings, "siteTitle" | "contactEmail">;

export const portalMailReady = (): boolean => getMailConfig() !== null;

export function portalUrl(path = ""): string | null {
  const base = getSiteUrl();
  return base ? `${base}/mukellef${path}` : null;
}

async function safely(task: () => Promise<unknown>, what: string) {
  try {
    await task();
  } catch (error) {
    console.error(`[mükellef köşesi] ${what} e-postası gönderilemedi:`, error);
  }
}

export function sendInviteMail(
  settings: Settings,
  to: string,
  name: string,
  token: string,
  purpose: "invite" | "reset",
) {
  const link = portalUrl(`/sifre?token=${token}`);
  if (!link) return Promise.resolve();
  const intro =
    purpose === "invite"
      ? `${settings.siteTitle} sizi Mükellef Köşesi'ne davet etti. Belgelerinizi güvenle paylaşabilir, ofisin size gönderdiği dosyaları ve eksik belge taleplerini görebilirsiniz.`
      : `Mükellef Köşesi şifrenizi yenilemek için bir istek alındı.`;
  return safely(
    () =>
      sendMailTo(settings, {
        to,
        subject:
          purpose === "invite"
            ? `${settings.siteTitle} — Mükellef Köşesi daveti`
            : `${settings.siteTitle} — Şifre belirleme bağlantısı`,
        text: [
          `Merhaba ${name},`,
          "",
          intro,
          "",
          "Şifrenizi belirlemek için bağlantıyı açın (72 saat geçerlidir, tek kullanımlıktır):",
          link,
          "",
          purpose === "reset"
            ? "Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz; şifreniz değişmez."
            : "Bu daveti beklemiyorsanız bu e-postayı yok sayabilirsiniz.",
        ].join("\n"),
      }),
    "davet",
  );
}

export function sendOfficeFileMail(settings: Settings, to: string, name: string) {
  const link = portalUrl();
  return safely(
    () =>
      sendMailTo(settings, {
        to,
        subject: `${settings.siteTitle} — Size yeni bir mesaj gönderildi`,
        text: [
          `Merhaba ${name},`,
          "",
          `${settings.siteTitle} Mükellef Köşesi'ne sizin için yeni bir mesaj ya da belge ekledi.`,
          link ? `Görüntülemek için giriş yapın: ${link}` : "Görüntülemek için Mükellef Köşesi'ne giriş yapın.",
        ].join("\n"),
      }),
    "yeni mesaj",
  );
}

export function sendNewRequestsMail(
  settings: Settings,
  to: string,
  name: string,
  count: number,
) {
  const link = portalUrl();
  return safely(
    () =>
      sendMailTo(settings, {
        to,
        subject: `${settings.siteTitle} — Eksik belge talebi`,
        text: [
          `Merhaba ${name},`,
          "",
          `Ofis sizden ${count} belge bekliyor.`,
          link
            ? `Hangi belgelerin gerektiğini görmek ve yüklemek için giriş yapın: ${link}`
            : "Ayrıntılar için Mükellef Köşesi'ne giriş yapın.",
        ].join("\n"),
      }),
    "eksik belge",
  );
}

/** Mükellef mesaj ya da belge gönderince ofise bildirim (NOTIFY_EMAIL ya da İletişim e-postası). */
export function sendClientUploadMail(settings: Settings, mukellefName: string, mukellefId: string) {
  const recipient = resolveRecipient(settings.contactEmail);
  if (!recipient) return Promise.resolve();
  const base = getSiteUrl();
  return safely(
    () =>
      sendMailTo(settings, {
        to: recipient,
        subject: `Mükellef mesaj gönderdi: ${mukellefName}`,
        text: [
          `${mukellefName} Mükellef Köşesi'nden yeni bir mesaj ya da belge gönderdi.`,
          base ? `Görüntüle: ${base}/admin/mukellefler/${mukellefId}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      }),
    "ofis bildirimi",
  );
}
