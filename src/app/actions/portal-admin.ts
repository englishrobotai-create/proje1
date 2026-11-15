"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import {
  addDocRequests,
  addFile,
  addLedgerEntry,
  createMukellef,
  createPortalToken,
  deleteDocRequest,
  deleteFileRow,
  deleteLedgerEntry,
  deleteMukellefRows,
  getFile,
  getMukellef,
  isId,
  listMukellefler,
  setDocRequestStatus,
  setMukellefActive,
  setPortalEnabled,
  updateMukellef,
} from "@/lib/portal-db";
import {
  checkOptionalUpload,
  removeAllStored,
  removeStored,
  storeFile,
} from "@/lib/portal-files";
import {
  sendInviteMail,
  sendNewRequestsMail,
  sendOfficeFileMail,
} from "@/lib/portal-mail";
import {
  MESSAGE_BODY_MAX,
  cleanMessageBody,
  isDateOnly,
  isLedgerKind,
  parseTL,
  type PortalState,
} from "@/lib/portal-shared";
import { getSiteUrl } from "@/lib/seo";
import { getSiteSettings } from "@/lib/settings";

const text = (value: FormDataEntryValue | null) =>
  typeof value === "string" ? value.trim() : "";

function refresh(id?: string) {
  revalidatePath("/admin/mukellefler");
  if (id) revalidatePath(`/admin/mukellefler/${id}`);
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Ad en az 2 karakter olmalı").max(120, "Ad en çok 120 karakter olabilir"),
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin").max(120),
  note: z.string().trim().max(500, "Not en çok 500 karakter olabilir"),
});

/** Davet (şifresi yoksa) ya da şifre sıfırlama bağlantısı üretir. */
async function issueLink(mukellef: { id: string; hasPassword: boolean }) {
  const purpose = mukellef.hasPassword ? "reset" : "invite";
  const token = await createPortalToken(mukellef.id, purpose);
  const base = getSiteUrl();
  const link = `${base ?? ""}/mukellef/sifre?token=${token}`;
  return { purpose, token, link, relative: base === null } as const;
}

const RELATIVE_NOTE =
  " Not: .env içinde SITE_URL tanımlı olmadığından bağlantının başına sitenizin adresini eklemelisiniz.";

// ---- Köşeyi aç / kapat ----

export async function togglePortalAction(
  _prev: PortalState,
  formData: FormData,
): Promise<PortalState> {
  await requireSession();
  const on = formData.get("enabled") === "on";
  await setPortalEnabled(on);
  // Üst menüdeki "Mükellef Girişi" bağlantısı site düzeninde olduğu için tüm site yenilenir.
  revalidatePath("/", "layout");
  refresh();
  return {
    success: on
      ? "Mükellef Köşesi açıldı. Sitenin menüsünde “Mükellef Girişi” görünür."
      : "Mükellef Köşesi kapatıldı. Giriş sayfası ve menü bağlantısı kalktı; açık oturumlar geçersiz sayılır.",
  };
}

// ---- Mükellef ----

export async function createMukellefAction(
  _prev: PortalState,
  formData: FormData,
): Promise<PortalState> {
  await requireSession();
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    note: text(formData.get("note")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz form" };
  }

  const created = await createMukellef(parsed.data);
  if (!created.ok) return { error: created.error };

  const { token, link, relative } = await issueLink({ id: created.id, hasPassword: false });
  const settings = await getSiteSettings();
  if (formData.get("send") === "on") {
    after(() =>
      sendInviteMail(settings, parsed.data.email, parsed.data.name, token, "invite"),
    );
  }
  refresh();
  return {
    success: `${parsed.data.name} eklendi. Davet bağlantısı aşağıdadır; yalnızca şimdi görünür, 72 saat geçerlidir.${relative ? RELATIVE_NOTE : ""}`,
    link,
  };
}

export async function updateMukellefAction(
  id: string,
  _prev: PortalState,
  formData: FormData,
): Promise<PortalState> {
  await requireSession();
  if (!isId(id) || !(await getMukellef(id))) return { error: "Mükellef bulunamadı." };
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    note: text(formData.get("note")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz form" };
  }
  const result = await updateMukellef(id, parsed.data);
  if (!result.ok) return { error: result.error };
  refresh(id);
  return { success: "Bilgiler kaydedildi." };
}

export async function newLinkAction(
  id: string,
  _prev: PortalState,
  formData: FormData,
): Promise<PortalState> {
  await requireSession();
  const mukellef = isId(id) ? await getMukellef(id) : null;
  if (!mukellef) return { error: "Mükellef bulunamadı." };
  if (!mukellef.active) return { error: "Devre dışı mükellef için bağlantı üretilemez. Önce etkinleştirin." };

  const { purpose, token, link, relative } = await issueLink(mukellef);
  const mailed = formData.get("send") === "on";
  if (mailed) {
    const settings = await getSiteSettings();
    after(() => sendInviteMail(settings, mukellef.email, mukellef.name, token, purpose));
  }
  refresh(id);
  return {
    success: `${purpose === "invite" ? "Yeni davet" : "Şifre sıfırlama"} bağlantısı hazır; yalnızca şimdi görünür, 72 saat geçerlidir. Öncekiler geçersiz oldu.${relative ? RELATIVE_NOTE : ""}`,
    link,
  };
}

export async function setMukellefActiveAction(id: string, active: boolean) {
  await requireSession();
  if (!isId(id) || !(await getMukellef(id))) return;
  await setMukellefActive(id, active);
  refresh(id);
}

export async function deleteMukellefAction(
  id: string,
  _prev: PortalState,
  formData: FormData,
): Promise<PortalState> {
  await requireSession();
  if (!isId(id) || !(await getMukellef(id))) return { error: "Mükellef bulunamadı." };
  if (formData.get("confirm") !== "on") {
    return { error: "Silmek için onay kutusunu işaretleyin." };
  }
  await deleteMukellefRows(id);
  await removeAllStored(id);
  refresh();
  redirect("/admin/mukellefler");
}

// ---- Ofisten mükellefe mesaj / belge ----

export async function sendOfficeMessageAction(
  id: string,
  _prev: PortalState,
  formData: FormData,
): Promise<PortalState> {
  await requireSession();
  const mukellef = isId(id) ? await getMukellef(id) : null;
  if (!mukellef) return { error: "Mükellef bulunamadı." };

  const title = text(formData.get("title"));
  if (!title) return { error: "Mesaja bir başlık yazın." };
  if (title.length > 120) return { error: "Başlık en çok 120 karakter olabilir." };
  const rawBody = typeof formData.get("body") === "string" ? (formData.get("body") as string) : "";
  const body = cleanMessageBody(rawBody);
  if (body.length > MESSAGE_BODY_MAX) {
    return { error: `Açıklama en çok ${MESSAGE_BODY_MAX} karakter olabilir.` };
  }

  // Ek isteğe bağlıdır: yalnızca başlık (ve açıklama) ile de mesaj gönderilebilir.
  const checked = await checkOptionalUpload(formData.get("file"), id);
  if (!checked.ok) return { error: checked.error };
  const attachment = "none" in checked ? null : checked;

  const storedName = attachment ? await storeFile(id, attachment.bytes) : "";
  try {
    await addFile({
      mukellefId: id,
      direction: "from_office",
      title,
      category: attachment ? "Belge" : "Mesaj",
      period: "",
      originalName: attachment?.originalName ?? "",
      storedName,
      size: attachment?.bytes.length ?? 0,
      body,
    });
  } catch (error) {
    if (storedName) await removeStored(id, storedName);
    throw error;
  }

  if (mukellef.active && mukellef.hasPassword) {
    const settings = await getSiteSettings();
    after(() => sendOfficeFileMail(settings, mukellef.email, mukellef.name));
  }
  refresh(id);
  return {
    success: mukellef.hasPassword
      ? "Mesaj mükellefin köşesine gönderildi."
      : "Mesaj kaydedildi. Mükellef davetini kabul edince görecek.",
  };
}

export async function deleteFileAdminAction(fileId: string) {
  await requireSession();
  const file = await getFile(fileId);
  if (!file) return;
  await deleteFileRow(file.id);
  await removeStored(file.mukellefId, file.storedName);
  refresh(file.mukellefId);
}

// ---- Eksik belge talepleri ----

const MAX_TITLES = 30;

function parseTitles(raw: string): { titles: string[]; error?: string } {
  const titles = [
    ...new Set(
      raw
        .split(/\r?\n/)
        .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
        .filter(Boolean),
    ),
  ];
  if (titles.length === 0) return { titles, error: "En az bir belge adı yazın (her satıra bir belge)." };
  if (titles.length > MAX_TITLES) return { titles, error: `Bir seferde en çok ${MAX_TITLES} belge istenebilir.` };
  if (titles.some((title) => title.length > 120)) {
    return { titles, error: "Belge adı en çok 120 karakter olabilir." };
  }
  return { titles };
}

export async function addRequestsAction(
  id: string,
  _prev: PortalState,
  formData: FormData,
): Promise<PortalState> {
  await requireSession();
  const mukellef = isId(id) ? await getMukellef(id) : null;
  if (!mukellef) return { error: "Mükellef bulunamadı." };

  const parsed = parseTitles(String(formData.get("titles") ?? ""));
  if (parsed.error) return { error: parsed.error };
  const note = text(formData.get("note")).slice(0, 300);

  const added = await addDocRequests(id, parsed.titles, note);
  if (added > 0 && mukellef.active && mukellef.hasPassword) {
    const settings = await getSiteSettings();
    after(() => sendNewRequestsMail(settings, mukellef.email, mukellef.name, added));
  }
  refresh(id);
  const skipped = parsed.titles.length - added;
  return {
    success:
      added === 0
        ? "Bu belgeler zaten açık talepte."
        : `${added} talep eklendi.${skipped > 0 ? ` ${skipped} belge zaten açıktı, tekrar eklenmedi.` : ""}`,
  };
}

export async function addRequestsForAllAction(
  _prev: PortalState,
  formData: FormData,
): Promise<PortalState> {
  await requireSession();
  const parsed = parseTitles(String(formData.get("titles") ?? ""));
  if (parsed.error) return { error: parsed.error };
  const note = text(formData.get("note")).slice(0, 300);

  const targets = (await listMukellefler()).filter((m) => m.active);
  if (targets.length === 0) return { error: "Etkin mükellef yok." };

  const settings = await getSiteSettings();
  let total = 0;
  let touched = 0;
  for (const mukellef of targets) {
    const added = await addDocRequests(mukellef.id, parsed.titles, note);
    if (added === 0) continue;
    total += added;
    touched += 1;
    if (mukellef.hasPassword) {
      after(() => sendNewRequestsMail(settings, mukellef.email, mukellef.name, added));
    }
  }
  refresh();
  return {
    success:
      total === 0
        ? "Bu belgeler tüm etkin mükellefler için zaten açık talepte."
        : `${touched} mükellefe toplam ${total} talep eklendi.`,
  };
}

export async function setRequestStatusAction(
  requestId: string,
  status: "open" | "done",
) {
  await requireSession();
  if (!isId(requestId)) return;
  await setDocRequestStatus(requestId, status === "done" ? "done" : "open");
  revalidatePath("/admin/mukellefler");
  revalidatePath("/admin/mukellefler/[id]", "page");
}

export async function deleteRequestAction(requestId: string) {
  await requireSession();
  if (!isId(requestId)) return;
  await deleteDocRequest(requestId);
  revalidatePath("/admin/mukellefler");
  revalidatePath("/admin/mukellefler/[id]", "page");
}

// ---- Hesap ekstresi ----

export async function addLedgerAction(
  id: string,
  _prev: PortalState,
  formData: FormData,
): Promise<PortalState> {
  await requireSession();
  if (!isId(id) || !(await getMukellef(id))) return { error: "Mükellef bulunamadı." };

  const kind = text(formData.get("kind"));
  if (!isLedgerKind(kind)) return { error: "İşlem türünü seçin." };
  const entryDate = text(formData.get("entryDate"));
  if (!isDateOnly(entryDate)) return { error: "Geçerli bir tarih girin." };
  const amountKurus = parseTL(text(formData.get("amount")));
  if (amountKurus === null) {
    return { error: "Tutarı 1.250,00 biçiminde yazın (nokta binlik, virgül kuruş ayracıdır)." };
  }
  const description = text(formData.get("description"));
  if (description.length < 2 || description.length > 160) {
    return { error: "Açıklama 2-160 karakter olmalı." };
  }

  await addLedgerEntry({ mukellefId: id, entryDate, kind, amountKurus, description });
  refresh(id);
  return { success: kind === "charge" ? "Borç kaydı eklendi." : "Ödeme kaydı eklendi." };
}

export async function deleteLedgerAction(entryId: string) {
  await requireSession();
  if (!isId(entryId)) return;
  await deleteLedgerEntry(entryId);
  revalidatePath("/admin/mukellefler");
  revalidatePath("/admin/mukellefler/[id]", "page");
}
