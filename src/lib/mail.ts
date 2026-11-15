import nodemailer from "nodemailer";
import { getSiteUrl } from "./seo";

/**
 * E-posta bildirimi (SMTP). Ayarlar .env'den okunur:
 *   SMTP_HOST, SMTP_PORT (587), SMTP_SECURE (465'te otomatik true), SMTP_USER, SMTP_PASS,
 *   MAIL_FROM (yoksa SMTP_USER), NOTIFY_EMAIL (yoksa İletişim sayfasındaki e-posta).
 * SMTP_HOST yoksa bildirim kapalıdır; mesajlar yine panele düşer.
 */
export type MailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
};

export type MailStatus = {
  ready: boolean;
  recipient?: string;
  host?: string;
  detail: string;
};

export type NotifyMessage = {
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  body: string;
};

const PLACEHOLDER_EMAIL = /@(ornek-mm\.com|ornek\.com|example\.(com|org|net))$/i;
const SIMPLE_EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

export function isUsableEmail(value: string): boolean {
  const text = value.trim();
  return SIMPLE_EMAIL.test(text) && !PLACEHOLDER_EMAIL.test(text);
}

export function getMailConfig(
  env: Record<string, string | undefined> = process.env,
): MailConfig | null {
  const host = env.SMTP_HOST?.trim();
  if (!host) return null;

  const port = Number(env.SMTP_PORT) || 587;
  const secureRaw = env.SMTP_SECURE?.trim();
  const secure = secureRaw ? /^(1|true|yes)$/i.test(secureRaw) : port === 465;
  const user = env.SMTP_USER?.trim() || undefined;
  const pass = env.SMTP_PASS || undefined;
  const from = env.MAIL_FROM?.trim() || user || "";
  if (!SIMPLE_EMAIL.test(from)) return null;

  return { host, port, secure, user, pass, from };
}

export function resolveRecipient(
  contactEmail: string,
  env: Record<string, string | undefined> = process.env,
): string | null {
  // .env'deki NOTIFY_EMAIL bilinçli bir seçimdir; yalnızca biçimine bakılır.
  const explicit = env.NOTIFY_EMAIL?.trim();
  if (explicit) return SIMPLE_EMAIL.test(explicit) ? explicit : null;
  // Sayfada görünen e-posta yer tutucu (info@ornek-mm.com vb.) ise bildirim gönderilmez.
  const shown = contactEmail.trim();
  return isUsableEmail(shown) ? shown : null;
}

export function getMailStatus(
  settings: { contactEmail: string },
  env: Record<string, string | undefined> = process.env,
): MailStatus {
  if (!env.SMTP_HOST?.trim()) {
    return {
      ready: false,
      detail:
        "E-posta bildirimi kapalı: .env dosyasında SMTP_HOST tanımlı değil. Mesajlar yalnızca bu panelde görünür.",
    };
  }
  const config = getMailConfig(env);
  if (!config) {
    return {
      ready: false,
      host: env.SMTP_HOST.trim(),
      detail:
        "E-posta bildirimi kapalı: gönderen adresi yok ya da geçersiz. .env içinde MAIL_FROM veya SMTP_USER (e-posta adresi biçiminde) tanımlayın.",
    };
  }
  const recipient = resolveRecipient(settings.contactEmail, env);
  if (!recipient) {
    return {
      ready: false,
      host: config.host,
      detail:
        "E-posta bildirimi kapalı: bildirimin gideceği adres geçersiz ya da yer tutucu. İletişim sayfasına gerçek e-postanızı yazın veya .env içinde NOTIFY_EMAIL tanımlayın.",
    };
  }
  return {
    ready: true,
    host: config.host,
    recipient,
    detail: `E-posta bildirimi açık: yeni mesajlar ${recipient} adresine gönderilir (SMTP: ${config.host}).`,
  };
}

function oneLine(value: string, max: number): string {
  return value.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, max);
}

function createTransport(config: MailConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.pass ?? "" } : undefined,
    // Parola giden bağlantılarda şifresiz hatta düşmesin.
    requireTLS: Boolean(config.user) && !config.secure,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

export function buildNotification(
  message: NotifyMessage,
  siteTitle: string,
  config: Pick<MailConfig, "from">,
  recipient: string,
) {
  const who = oneLine(message.name, 80) || "Ziyaretçi";
  const topic = oneLine(message.subject ?? "", 120);
  const panelUrl = getSiteUrl();

  const lines = [
    "Web sitenizden yeni bir mesaj geldi.",
    "",
    `Ad Soyad: ${oneLine(message.name, 80)}`,
    `E-posta: ${oneLine(message.email, 120)}`,
    message.phone ? `Telefon: ${oneLine(message.phone, 30)}` : null,
    topic ? `Konu: ${topic}` : null,
    "",
    message.body,
    "",
    panelUrl ? `Panelde görüntüle: ${panelUrl}/admin/mesajlar` : null,
  ].filter((line): line is string => line !== null);

  return {
    from: { name: oneLine(siteTitle, 80) || "Web sitesi", address: config.from },
    to: recipient,
    replyTo: { name: who, address: message.email.trim() },
    subject: oneLine(`Yeni mesaj: ${topic || "Genel"} — ${who}`, 150),
    text: lines.join("\n"),
  };
}

/** Yeni mesaj bildirimi. Ayar yoksa sessizce atlar; hata olursa fırlatır. */
export async function notifyNewMessage(
  message: NotifyMessage,
  settings: { siteTitle: string; contactEmail: string },
): Promise<"sent" | "skipped"> {
  const config = getMailConfig();
  const recipient = resolveRecipient(settings.contactEmail);
  if (!config || !recipient) return "skipped";

  const transport = createTransport(config);
  try {
    await transport.sendMail(
      buildNotification(message, settings.siteTitle, config, recipient),
    );
    return "sent";
  } finally {
    transport.close();
  }
}

/** Portal bildirimleri için genel gönderim. SMTP yoksa sessizce atlar; hata olursa fırlatır. */
export async function sendMailTo(
  settings: { siteTitle: string },
  message: { to: string; subject: string; text: string },
): Promise<"sent" | "skipped"> {
  const config = getMailConfig();
  if (!config || !isUsableEmail(message.to)) return "skipped";

  const transport = createTransport(config);
  try {
    await transport.sendMail({
      from: { name: oneLine(settings.siteTitle, 80) || "Web sitesi", address: config.from },
      to: message.to.trim(),
      subject: oneLine(message.subject, 150),
      text: message.text,
    });
    return "sent";
  } finally {
    transport.close();
  }
}

/** Yönetici panelindeki "Test e-postası gönder" düğmesi için. Hata olursa fırlatır. */
export async function sendTestMail(settings: {
  siteTitle: string;
  contactEmail: string;
}): Promise<string> {
  const config = getMailConfig();
  if (!config) throw new Error("SMTP ayarı eksik");
  const recipient = resolveRecipient(settings.contactEmail);
  if (!recipient) throw new Error("Bildirim adresi geçersiz ya da yer tutucu");

  const transport = createTransport(config);
  try {
    await transport.sendMail({
      from: { name: oneLine(settings.siteTitle, 80) || "Web sitesi", address: config.from },
      to: recipient,
      subject: "Test: e-posta bildirimi çalışıyor",
      text: "Bu bir test e-postasıdır. Bunu görüyorsanız sitenizden gelen mesajlar bu adrese iletilecek.",
    });
    return recipient;
  } finally {
    transport.close();
  }
}
