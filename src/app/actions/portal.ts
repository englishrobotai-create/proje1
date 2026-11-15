"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import {
  allowPortalAttempt,
  allowPortalReset,
  createPortalSession,
  destroyPortalSession,
  getPortalSession,
  hashPortalPassword,
  loginMukellef,
} from "@/lib/portal-auth";
import {
  addFile,
  consumeToken,
  createPortalToken,
  findValidToken,
  fulfillDocRequest,
  getDocRequest,
  getMukellefAuth,
  getMukellefAuthByEmail,
  hideFileFromClient,
  isId,
  isPortalEnabled,
  setMukellefPassword,
} from "@/lib/portal-db";
import { checkOptionalUpload, removeStored, storeFile } from "@/lib/portal-files";
import {
  portalMailReady,
  sendClientUploadMail,
  sendInviteMail,
} from "@/lib/portal-mail";
import {
  MESSAGE_BODY_MAX,
  cleanMessageBody,
  normalizeEmail,
  validateNewPassword,
  type PortalState,
} from "@/lib/portal-shared";
import { allowRequest } from "@/lib/rate-limit";
import { getSiteSettings } from "@/lib/settings";

const text = (value: FormDataEntryValue | null) =>
  typeof value === "string" ? value.trim() : "";

const emailSchema = z.string().trim().toLowerCase().email().max(120);

export async function portalLoginAction(
  _prev: PortalState,
  formData: FormData,
): Promise<PortalState> {
  if (!(await isPortalEnabled())) return { error: "Mükellef Köşesi şu an kapalı." };

  const email = emailSchema.safeParse(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  if (!email.success || password.length === 0 || password.length > 200) {
    return { error: "E-posta veya şifre hatalı." };
  }
  if (!(await allowPortalAttempt(email.data))) {
    return { error: "Çok fazla deneme yapıldı. Lütfen biraz bekleyip tekrar deneyin." };
  }

  const mukellef = await loginMukellef(email.data, password);
  if (!mukellef) return { error: "E-posta veya şifre hatalı." };
  redirect("/mukellef");
}

export async function portalLogoutAction() {
  await destroyPortalSession();
  redirect("/mukellef/giris");
}

/** Davet ya da sıfırlama bağlantısıyla şifre belirler; başarılıysa oturumu açar. */
export async function setPasswordAction(
  _prev: PortalState,
  formData: FormData,
): Promise<PortalState> {
  if (!(await isPortalEnabled())) return { error: "Mükellef Köşesi şu an kapalı." };

  const token = text(formData.get("token"));
  const password = String(formData.get("password") ?? "");
  const repeat = String(formData.get("password2") ?? "");

  const valid = await findValidToken(token);
  if (!valid) {
    return { error: "Bu bağlantı geçersiz, süresi dolmuş ya da daha önce kullanılmış. Ofisten yeni bağlantı isteyin." };
  }
  const weak = validateNewPassword(password, valid.mukellef.email);
  if (weak) return { error: weak };
  if (password !== repeat) return { error: "Şifreler aynı değil." };

  // Bağlantı tek kullanımlıktır; aynı anda gelen başka bir istek önce tükettiyse bu reddedilir.
  if (!(await consumeToken(valid.tokenId))) {
    return { error: "Bu bağlantı az önce kullanıldı. Ofisten yeni bağlantı isteyin." };
  }
  await setMukellefPassword(valid.mukellef.id, await hashPortalPassword(password));

  const updated = await getMukellefAuth(valid.mukellef.id);
  if (!updated) return { error: "Hesap bulunamadı." };
  await createPortalSession(updated);
  redirect("/mukellef");
}

const FORGOT_TEXT =
  "Bu e-posta adresiyle kayıtlı bir hesap varsa, şifre belirleme bağlantısı gönderildi. Birkaç dakika içinde gelmezse ofisle iletişime geçin.";

export async function forgotPasswordAction(
  _prev: PortalState,
  formData: FormData,
): Promise<PortalState> {
  if (!(await isPortalEnabled())) return { error: "Mükellef Köşesi şu an kapalı." };

  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: "Geçerli bir e-posta adresi girin." };
  if (!(await allowPortalReset(email.data))) {
    return { error: "Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin." };
  }
  // E-posta gönderimi kapalıysa bağlantı gidemez; kullanıcıya dürüstçe söylenir.
  if (!portalMailReady()) {
    return { error: "Bu sitede e-posta gönderimi kapalı. Şifre bağlantısı için lütfen ofisle iletişime geçin." };
  }

  // Hesap var mı yok mu belli edilmez: yanıt her durumda aynıdır.
  const mukellef = await getMukellefAuthByEmail(normalizeEmail(email.data));
  if (mukellef && mukellef.active) {
    const purpose = mukellef.hasPassword ? "reset" : "invite";
    const token = await createPortalToken(mukellef.id, purpose);
    const settings = await getSiteSettings();
    after(() => sendInviteMail(settings, mukellef.email, mukellef.name, token, purpose));
  }
  return { success: FORGOT_TEXT };
}

/** Mükellef ofise belge yükler; isteğe bağlı olarak bir eksik belge talebini karşılar. */
export async function sendClientMessageAction(
  _prev: PortalState,
  formData: FormData,
): Promise<PortalState> {
  const session = await getPortalSession();
  if (!session) return { error: "Oturumunuz sona erdi. Lütfen yeniden giriş yapın." };

  // Hesap başına saatte en çok 30 gönderim.
  if (!allowRequest(`portal-upload:${session.id}`, 30, 60 * 60_000)) {
    return { error: "Kısa sürede çok fazla mesaj gönderildi. Lütfen bir süre sonra tekrar deneyin." };
  }

  const title = text(formData.get("title"));
  if (!title) return { error: "Mesaja bir başlık yazın." };
  if (title.length > 120) return { error: "Başlık en çok 120 karakter olabilir." };
  const rawBody = typeof formData.get("body") === "string" ? (formData.get("body") as string) : "";
  const body = cleanMessageBody(rawBody);
  if (body.length > MESSAGE_BODY_MAX) {
    return { error: `Açıklama en çok ${MESSAGE_BODY_MAX} karakter olabilir.` };
  }

  // Talep kimliği istemciden gelir; yalnızca bu mükellefin açık talebi kabul edilir.
  const requestId = text(formData.get("requestId"));
  let requestPeriod = "";
  if (requestId) {
    const request = isId(requestId) ? await getDocRequest(requestId) : null;
    if (!request || request.mukellefId !== session.id || request.status !== "open") {
      return { error: "Seçilen talep bulunamadı ya da zaten karşılanmış." };
    }
    requestPeriod = request.period;
  }

  // Ek isteğe bağlıdır; ancak bir eksik belge talebini karşılamak için dosya eklenmelidir.
  const checked = await checkOptionalUpload(formData.get("file"), session.id);
  if (!checked.ok) return { error: checked.error };
  const attachment = "none" in checked ? null : checked;
  if (requestId && !attachment) {
    return { error: "Eksik belge talebini karşılamak için bir dosya ekleyin." };
  }

  const storedName = attachment ? await storeFile(session.id, attachment.bytes) : "";
  try {
    await addFile({
      mukellefId: session.id,
      direction: "from_mukellef",
      title,
      category: attachment ? "Belge" : "Mesaj",
      period: requestPeriod,
      originalName: attachment?.originalName ?? "",
      storedName,
      size: attachment?.bytes.length ?? 0,
      requestId,
      body,
    });
  } catch (error) {
    if (storedName) await removeStored(session.id, storedName);
    throw error;
  }
  if (requestId) await fulfillDocRequest(requestId, session.id);

  // Ofise en çok 10 dakikada bir bildirim gider; art arda gönderimler e-posta yağmuru yaratmaz.
  if (allowRequest(`portal-notify:${session.id}`, 1, 10 * 60_000)) {
    const settings = await getSiteSettings();
    after(() => sendClientUploadMail(settings, session.name, session.id));
  }
  return { success: "Mesajınız ofise iletildi. Teşekkürler." };
}

/** Ofisten gelen bir mesajı yalnızca mükellefin kendi listesinden kaldırır; ofisteki kayıt durur. */
export async function hideOfficeMessageAction(fileId: string) {
  const session = await getPortalSession();
  if (!session || !isId(fileId)) return;
  await hideFileFromClient(fileId, session.id);
  revalidatePath("/mukellef");
  revalidatePath("/mukellef/belgeler");
}
