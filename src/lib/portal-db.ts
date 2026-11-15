import { createHash, randomBytes, randomUUID } from "node:crypto";
import { ensureColumns, prisma } from "./db";
import { getSiteSettings } from "./settings";
import {
  normalizeEmail,
  type LedgerKind,
  signedAmount,
} from "./portal-shared";

/**
 * Mükellef Köşesi veri katmanı. Tablolar ilk kullanımda kendiliğinden oluşturulur (kullanıcı
 * `prisma db push` yapmak zorunda kalmasın) ve ham SQL ile okunup yazılır: Prisma istemcisi bu
 * modelleri bilmeyebilir. Şemadaki (schema.prisma) tanımlarla birebir aynıdır.
 * Tarihler ISO metin, tutarlar tam sayı kuruştur.
 */

const DDL = [
  `CREATE TABLE IF NOT EXISTS "Mukellef" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL DEFAULT '',
    "active" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" TEXT NOT NULL,
    "lastLoginAt" TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Mukellef_email_key" ON "Mukellef"("email")`,
  `CREATE TABLE IF NOT EXISTS "PortalToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mukellefId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" TEXT NOT NULL,
    "usedAt" TEXT NOT NULL DEFAULT '',
    "createdAt" TEXT NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "PortalToken_tokenHash_key" ON "PortalToken"("tokenHash")`,
  `CREATE INDEX IF NOT EXISTS "PortalToken_mukellefId_idx" ON "PortalToken"("mukellefId")`,
  `CREATE TABLE IF NOT EXISTS "PortalFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mukellefId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "period" TEXT NOT NULL DEFAULT '',
    "originalName" TEXT NOT NULL,
    "storedName" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "requestId" TEXT NOT NULL DEFAULT '',
    "createdAt" TEXT NOT NULL,
    "readAt" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "hiddenByClientAt" TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE INDEX IF NOT EXISTS "PortalFile_mukellefId_idx" ON "PortalFile"("mukellefId")`,
  `CREATE TABLE IF NOT EXISTS "DocRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mukellefId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TEXT NOT NULL,
    "fulfilledAt" TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE INDEX IF NOT EXISTS "DocRequest_mukellefId_idx" ON "DocRequest"("mukellefId")`,
  `CREATE TABLE IF NOT EXISTS "LedgerEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mukellefId" TEXT NOT NULL,
    "entryDate" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "amountKurus" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "LedgerEntry_mukellefId_idx" ON "LedgerEntry"("mukellefId")`,
];

const PORTAL_FILE_EXTRA_COLUMNS = [
  { name: "body", definition: `TEXT NOT NULL DEFAULT ''` },
  { name: "hiddenByClientAt", definition: `TEXT NOT NULL DEFAULT ''` },
] as const;

let ready: Promise<void> | undefined;

export function ensurePortalTables(): Promise<void> {
  ready ??= (async () => {
    await ensureColumns();
    for (const statement of DDL) {
      await prisma.$executeRawUnsafe(statement);
    }
    // Önceki sürümlerde oluşturulmuş PortalFile tablosuna sonradan eklenen sütunları ekler.
    const existing = await prisma.$queryRawUnsafe<{ name: string }[]>(
      `PRAGMA table_info("PortalFile")`,
    );
    for (const column of PORTAL_FILE_EXTRA_COLUMNS) {
      if (existing.some((item) => item.name === column.name)) continue;
      try {
        await prisma.$executeRawUnsafe(
          `ALTER TABLE "PortalFile" ADD COLUMN "${column.name}" ${column.definition}`,
        );
      } catch (error) {
        // Başka bir istek aynı anda eklemiş olabilir; sütun artık varsa sorun yok.
        const again = await prisma.$queryRawUnsafe<{ name: string }[]>(
          `PRAGMA table_info("PortalFile")`,
        );
        if (!again.some((item) => item.name === column.name)) throw error;
      }
    }
  })().catch((error) => {
    ready = undefined;
    throw error;
  });
  return ready;
}

const num = (value: unknown): number => Number(value ?? 0);
const nowIso = () => new Date().toISOString();
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const isId = (value: unknown): value is string =>
  typeof value === "string" && UUID.test(value);

function isUniqueError(error: unknown): boolean {
  const text = error instanceof Error ? error.message : String(error);
  return /unique constraint|UNIQUE/i.test(text);
}

// ---- Açık/kapalı ----

export async function isPortalEnabled(): Promise<boolean> {
  try {
    await ensureColumns();
    const rows = await prisma.$queryRaw<{ portalEnabled: number | bigint }[]>`
      SELECT "portalEnabled" FROM "Setting" WHERE "id" = 'main'
    `;
    return num(rows[0]?.portalEnabled) === 1;
  } catch {
    return false;
  }
}

export async function setPortalEnabled(on: boolean): Promise<void> {
  await ensurePortalTables();
  const settings = await getSiteSettings();
  await prisma.setting.upsert({
    where: { id: "main" },
    update: {},
    create: { id: "main", siteTitle: settings.siteTitle },
  });
  await prisma.$executeRaw`
    UPDATE "Setting" SET "portalEnabled" = ${on ? 1 : 0} WHERE "id" = 'main'
  `;
}

// ---- Mükellef ----

export type Mukellef = {
  id: string;
  name: string;
  email: string;
  /** Davet kabul edilip şifre belirlendi mi. */
  hasPassword: boolean;
  active: boolean;
  note: string;
  createdAt: string;
  lastLoginAt: string;
};

export type MukellefAuth = Mukellef & { passwordHash: string };

type MukellefRow = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  active: number | bigint;
  note: string;
  createdAt: string;
  lastLoginAt: string;
};

const toAuth = (row: MukellefRow): MukellefAuth => ({
  id: row.id,
  name: row.name,
  email: row.email,
  passwordHash: row.passwordHash,
  hasPassword: row.passwordHash !== "",
  active: num(row.active) === 1,
  note: row.note,
  createdAt: row.createdAt,
  lastLoginAt: row.lastLoginAt,
});

const toPublic = (row: MukellefRow): Mukellef => {
  const { passwordHash, ...rest } = toAuth(row);
  void passwordHash;
  return rest;
};

export async function getMukellefAuth(id: string): Promise<MukellefAuth | null> {
  if (!isId(id)) return null;
  await ensurePortalTables();
  const rows = await prisma.$queryRaw<MukellefRow[]>`
    SELECT * FROM "Mukellef" WHERE "id" = ${id}
  `;
  return rows[0] ? toAuth(rows[0]) : null;
}

export async function getMukellef(id: string): Promise<Mukellef | null> {
  const auth = await getMukellefAuth(id);
  if (!auth) return null;
  const { passwordHash, ...rest } = auth;
  void passwordHash;
  return rest;
}

export async function getMukellefAuthByEmail(
  email: string,
): Promise<MukellefAuth | null> {
  await ensurePortalTables();
  const normalized = normalizeEmail(email);
  const rows = await prisma.$queryRaw<MukellefRow[]>`
    SELECT * FROM "Mukellef" WHERE "email" = ${normalized}
  `;
  return rows[0] ? toAuth(rows[0]) : null;
}

export type MukellefListItem = Mukellef & {
  openRequests: number;
  newFiles: number;
  balanceKurus: number;
};

export async function listMukellefler(): Promise<MukellefListItem[]> {
  await ensurePortalTables();
  const rows = await prisma.$queryRaw<
    (MukellefRow & {
      openRequests: number | bigint;
      newFiles: number | bigint;
      balance: number | bigint;
    })[]
  >`
    SELECT m.*,
      (SELECT COUNT(*) FROM "DocRequest" d
         WHERE d."mukellefId" = m."id" AND d."status" = 'open') AS "openRequests",
      (SELECT COUNT(*) FROM "PortalFile" f
         WHERE f."mukellefId" = m."id" AND f."direction" = 'from_mukellef'
           AND f."readAt" = '') AS "newFiles",
      (SELECT COALESCE(SUM(CASE WHEN l."kind" = 'charge'
                                THEN l."amountKurus" ELSE -l."amountKurus" END), 0)
         FROM "LedgerEntry" l WHERE l."mukellefId" = m."id") AS "balance"
    FROM "Mukellef" m
  `;
  return rows
    .map((row) => ({
      ...toPublic(row),
      openRequests: num(row.openRequests),
      newFiles: num(row.newFiles),
      balanceKurus: num(row.balance),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));
}

type WriteResult = { ok: true; id: string } | { ok: false; error: string };

export async function createMukellef(input: {
  name: string;
  email: string;
  note: string;
}): Promise<WriteResult> {
  await ensurePortalTables();
  const email = normalizeEmail(input.email);
  if (await getMukellefAuthByEmail(email)) {
    return { ok: false, error: "Bu e-posta adresiyle kayıtlı bir mükellef zaten var." };
  }
  const id = randomUUID();
  try {
    await prisma.$executeRaw`
      INSERT INTO "Mukellef" ("id", "name", "email", "note", "createdAt")
      VALUES (${id}, ${input.name}, ${email}, ${input.note}, ${nowIso()})
    `;
  } catch (error) {
    if (isUniqueError(error)) {
      return { ok: false, error: "Bu e-posta adresiyle kayıtlı bir mükellef zaten var." };
    }
    throw error;
  }
  return { ok: true, id };
}

export async function updateMukellef(
  id: string,
  input: { name: string; email: string; note: string },
): Promise<WriteResult> {
  await ensurePortalTables();
  const email = normalizeEmail(input.email);
  const other = await getMukellefAuthByEmail(email);
  if (other && other.id !== id) {
    return { ok: false, error: "Bu e-posta adresi başka bir mükellefte kayıtlı." };
  }
  try {
    await prisma.$executeRaw`
      UPDATE "Mukellef" SET "name" = ${input.name}, "email" = ${email}, "note" = ${input.note}
      WHERE "id" = ${id}
    `;
  } catch (error) {
    if (isUniqueError(error)) {
      return { ok: false, error: "Bu e-posta adresi başka bir mükellefte kayıtlı." };
    }
    throw error;
  }
  return { ok: true, id };
}

export async function setMukellefActive(id: string, active: boolean) {
  await ensurePortalTables();
  await prisma.$executeRaw`
    UPDATE "Mukellef" SET "active" = ${active ? 1 : 0} WHERE "id" = ${id}
  `;
}

export async function setMukellefPassword(id: string, passwordHash: string) {
  await ensurePortalTables();
  await prisma.$executeRaw`
    UPDATE "Mukellef" SET "passwordHash" = ${passwordHash} WHERE "id" = ${id}
  `;
}

export async function touchLogin(id: string) {
  await ensurePortalTables();
  await prisma.$executeRaw`
    UPDATE "Mukellef" SET "lastLoginAt" = ${nowIso()} WHERE "id" = ${id}
  `;
}

/** Mükellefi ve tüm kayıtlarını siler (dosyaları diskten silmek çağıranın işidir). */
export async function deleteMukellefRows(id: string) {
  await ensurePortalTables();
  await prisma.$transaction([
    prisma.$executeRaw`DELETE FROM "PortalToken" WHERE "mukellefId" = ${id}`,
    prisma.$executeRaw`DELETE FROM "PortalFile" WHERE "mukellefId" = ${id}`,
    prisma.$executeRaw`DELETE FROM "DocRequest" WHERE "mukellefId" = ${id}`,
    prisma.$executeRaw`DELETE FROM "LedgerEntry" WHERE "mukellefId" = ${id}`,
    prisma.$executeRaw`DELETE FROM "Mukellef" WHERE "id" = ${id}`,
  ]);
}

// ---- Davet / sıfırlama bağlantıları ----

export type TokenPurpose = "invite" | "reset";

export const hashToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex");

/** 32 rastgele bayt → 43 karakterlik URL-güvenli metin. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
export const isTokenShape = (value: unknown): value is string =>
  typeof value === "string" && TOKEN_PATTERN.test(value);

/** Yeni bağlantı üretir; mükellefin kullanılmamış eski bağlantıları geçersiz olur. */
export async function createPortalToken(
  mukellefId: string,
  purpose: TokenPurpose,
  ttlHours = 72,
): Promise<string> {
  await ensurePortalTables();
  const token = randomBytes(32).toString("base64url");
  const now = nowIso();
  const expiresAt = new Date(Date.now() + ttlHours * 3_600_000).toISOString();
  await prisma.$transaction([
    prisma.$executeRaw`
      DELETE FROM "PortalToken"
      WHERE "expiresAt" < ${now} OR ("mukellefId" = ${mukellefId} AND "usedAt" = '')
    `,
    prisma.$executeRaw`
      INSERT INTO "PortalToken" ("id", "mukellefId", "tokenHash", "purpose", "expiresAt", "createdAt")
      VALUES (${randomUUID()}, ${mukellefId}, ${hashToken(token)}, ${purpose}, ${expiresAt}, ${now})
    `,
  ]);
  return token;
}

export type ValidToken = {
  tokenId: string;
  purpose: TokenPurpose;
  mukellef: MukellefAuth;
};

/** Süresi dolmamış, kullanılmamış ve mükellefi etkin olan bağlantıyı döndürür. */
export async function findValidToken(token: string): Promise<ValidToken | null> {
  if (!isTokenShape(token)) return null;
  await ensurePortalTables();
  const rows = await prisma.$queryRaw<{ id: string; purpose: string; mukellefId: string }[]>`
    SELECT "id", "purpose", "mukellefId" FROM "PortalToken"
    WHERE "tokenHash" = ${hashToken(token)} AND "usedAt" = '' AND "expiresAt" > ${nowIso()}
  `;
  const row = rows[0];
  if (!row || (row.purpose !== "invite" && row.purpose !== "reset")) return null;
  const mukellef = await getMukellefAuth(row.mukellefId);
  if (!mukellef || !mukellef.active) return null;
  return { tokenId: row.id, purpose: row.purpose, mukellef };
}

/** Bağlantıyı tek seferlik tüketir. Başka istek önce tükettiyse false döner. */
export async function consumeToken(tokenId: string): Promise<boolean> {
  const changed = await prisma.$executeRaw`
    UPDATE "PortalToken" SET "usedAt" = ${nowIso()} WHERE "id" = ${tokenId} AND "usedAt" = ''
  `;
  return num(changed) === 1;
}

// ---- Belgeler ----

export type FileDirection = "from_mukellef" | "from_office";

export type PortalFileRow = {
  id: string;
  mukellefId: string;
  direction: FileDirection;
  title: string;
  category: string;
  period: string;
  originalName: string;
  storedName: string;
  size: number;
  requestId: string;
  createdAt: string;
  /** Karşı tarafın ilk açma zamanı; boşsa henüz açılmadı. */
  readAt: string;
  /** Mesajın açıklama metni (boş olabilir). */
  body: string;
  /** Mükellef bu (ofisten gelen) mesajı kendi listesinden kaldırdıysa zamanı; ofis kaydı durur. */
  hiddenByClientAt: string;
};

type FileRow = Omit<PortalFileRow, "size" | "direction"> & {
  size: number | bigint;
  direction: string;
};

const toFile = (row: FileRow): PortalFileRow => ({
  ...row,
  size: num(row.size),
  direction: row.direction === "from_office" ? "from_office" : "from_mukellef",
});

export async function addFile(input: {
  mukellefId: string;
  direction: FileDirection;
  title: string;
  category: string;
  period: string;
  originalName: string;
  storedName: string;
  size: number;
  requestId?: string;
  body?: string;
}): Promise<PortalFileRow> {
  await ensurePortalTables();
  const id = randomUUID();
  const createdAt = nowIso();
  await prisma.$executeRaw`
    INSERT INTO "PortalFile"
      ("id", "mukellefId", "direction", "title", "category", "period", "originalName",
       "storedName", "size", "requestId", "createdAt", "body")
    VALUES
      (${id}, ${input.mukellefId}, ${input.direction}, ${input.title}, ${input.category},
       ${input.period}, ${input.originalName}, ${input.storedName}, ${input.size},
       ${input.requestId ?? ""}, ${createdAt}, ${input.body ?? ""})
  `;
  return {
    ...input,
    requestId: input.requestId ?? "",
    body: input.body ?? "",
    id,
    createdAt,
    readAt: "",
    hiddenByClientAt: "",
  };
}

export async function listFiles(mukellefId: string): Promise<PortalFileRow[]> {
  await ensurePortalTables();
  const rows = await prisma.$queryRaw<FileRow[]>`
    SELECT * FROM "PortalFile" WHERE "mukellefId" = ${mukellefId}
    ORDER BY "createdAt" DESC
  `;
  return rows.map(toFile);
}

/** Mükellefin göreceği liste: kendi listesinden kaldırdığı ofis mesajları hariç. */
export async function listFilesForClient(mukellefId: string): Promise<PortalFileRow[]> {
  const files = await listFiles(mukellefId);
  return files.filter((file) => !(file.direction === "from_office" && file.hiddenByClientAt));
}

/** Ofisten gelen bir mesajı yalnızca mükellefin listesinden kaldırır (ofis kaydı silinmez). */
export async function hideFileFromClient(id: string, mukellefId: string): Promise<boolean> {
  await ensurePortalTables();
  const changed = await prisma.$executeRaw`
    UPDATE "PortalFile" SET "hiddenByClientAt" = ${nowIso()}
    WHERE "id" = ${id} AND "mukellefId" = ${mukellefId}
      AND "direction" = 'from_office' AND "hiddenByClientAt" = ''
  `;
  return num(changed) === 1;
}

export async function getFile(id: string): Promise<PortalFileRow | null> {
  if (!isId(id)) return null;
  await ensurePortalTables();
  const rows = await prisma.$queryRaw<FileRow[]>`
    SELECT * FROM "PortalFile" WHERE "id" = ${id}
  `;
  return rows[0] ? toFile(rows[0]) : null;
}

export async function markFileRead(id: string) {
  await prisma.$executeRaw`
    UPDATE "PortalFile" SET "readAt" = ${nowIso()} WHERE "id" = ${id} AND "readAt" = ''
  `;
}

export async function deleteFileRow(id: string) {
  await prisma.$executeRaw`DELETE FROM "PortalFile" WHERE "id" = ${id}`;
}

export async function storedBytes(mukellefId: string): Promise<number> {
  await ensurePortalTables();
  const rows = await prisma.$queryRaw<{ total: number | bigint | null }[]>`
    SELECT COALESCE(SUM("size"), 0) AS "total" FROM "PortalFile"
    WHERE "mukellefId" = ${mukellefId}
  `;
  return num(rows[0]?.total);
}

// ---- Eksik belge talepleri ----

export type DocRequestRow = {
  id: string;
  mukellefId: string;
  period: string;
  title: string;
  note: string;
  status: "open" | "done";
  createdAt: string;
  fulfilledAt: string;
};

type RequestRow = Omit<DocRequestRow, "status"> & { status: string };

const toRequest = (row: RequestRow): DocRequestRow => ({
  ...row,
  status: row.status === "done" ? "done" : "open",
});

/**
 * Aynı başlıkla açık bir talep varsa yenisini eklemez. Eklenen sayıyı döndürür. Talepler artık
 * dönemsizdir ("period" boş kalır); eski kayıtlardaki dönem bilgisi gösterimde korunur.
 */
export async function addDocRequests(
  mukellefId: string,
  titles: string[],
  note: string,
): Promise<number> {
  await ensurePortalTables();
  const existing = await prisma.$queryRaw<{ title: string }[]>`
    SELECT "title" FROM "DocRequest"
    WHERE "mukellefId" = ${mukellefId} AND "status" = 'open'
  `;
  const seen = new Set(existing.map((row) => row.title.toLocaleLowerCase("tr")));
  let added = 0;
  for (const title of titles) {
    const key = title.toLocaleLowerCase("tr");
    if (seen.has(key)) continue;
    seen.add(key);
    await prisma.$executeRaw`
      INSERT INTO "DocRequest" ("id", "mukellefId", "period", "title", "note", "createdAt")
      VALUES (${randomUUID()}, ${mukellefId}, '', ${title}, ${note}, ${nowIso()})
    `;
    added += 1;
  }
  return added;
}

export async function listDocRequests(mukellefId: string): Promise<DocRequestRow[]> {
  await ensurePortalTables();
  const rows = await prisma.$queryRaw<RequestRow[]>`
    SELECT * FROM "DocRequest" WHERE "mukellefId" = ${mukellefId}
    ORDER BY "status" ASC, "createdAt" DESC
  `;
  return rows.map(toRequest);
}

export async function getDocRequest(id: string): Promise<DocRequestRow | null> {
  if (!isId(id)) return null;
  await ensurePortalTables();
  const rows = await prisma.$queryRaw<RequestRow[]>`
    SELECT * FROM "DocRequest" WHERE "id" = ${id}
  `;
  return rows[0] ? toRequest(rows[0]) : null;
}

export async function setDocRequestStatus(id: string, status: "open" | "done") {
  await ensurePortalTables();
  await prisma.$executeRaw`
    UPDATE "DocRequest"
    SET "status" = ${status}, "fulfilledAt" = ${status === "done" ? nowIso() : ""}
    WHERE "id" = ${id}
  `;
}

/** Yalnızca o mükellefin açık talebini kapatır (başkasının talebine dokunamaz). */
export async function fulfillDocRequest(id: string, mukellefId: string): Promise<boolean> {
  const changed = await prisma.$executeRaw`
    UPDATE "DocRequest" SET "status" = 'done', "fulfilledAt" = ${nowIso()}
    WHERE "id" = ${id} AND "mukellefId" = ${mukellefId} AND "status" = 'open'
  `;
  return num(changed) === 1;
}

export async function deleteDocRequest(id: string) {
  await ensurePortalTables();
  await prisma.$executeRaw`DELETE FROM "DocRequest" WHERE "id" = ${id}`;
}

// ---- Hesap ekstresi ----

export type LedgerRow = {
  id: string;
  mukellefId: string;
  entryDate: string;
  kind: LedgerKind;
  amountKurus: number;
  description: string;
  createdAt: string;
};

type LedgerDbRow = Omit<LedgerRow, "kind" | "amountKurus"> & {
  kind: string;
  amountKurus: number | bigint;
};

const toLedger = (row: LedgerDbRow): LedgerRow => ({
  ...row,
  kind: row.kind === "payment" ? "payment" : "charge",
  amountKurus: num(row.amountKurus),
});

export async function addLedgerEntry(input: {
  mukellefId: string;
  entryDate: string;
  kind: LedgerKind;
  amountKurus: number;
  description: string;
}) {
  await ensurePortalTables();
  await prisma.$executeRaw`
    INSERT INTO "LedgerEntry"
      ("id", "mukellefId", "entryDate", "kind", "amountKurus", "description", "createdAt")
    VALUES
      (${randomUUID()}, ${input.mukellefId}, ${input.entryDate}, ${input.kind},
       ${input.amountKurus}, ${input.description}, ${nowIso()})
  `;
}

/** Tarihe göre eskiden yeniye. */
export async function listLedger(mukellefId: string): Promise<LedgerRow[]> {
  await ensurePortalTables();
  const rows = await prisma.$queryRaw<LedgerDbRow[]>`
    SELECT * FROM "LedgerEntry" WHERE "mukellefId" = ${mukellefId}
    ORDER BY "entryDate" ASC, "createdAt" ASC
  `;
  return rows.map(toLedger);
}

export async function deleteLedgerEntry(id: string) {
  await ensurePortalTables();
  await prisma.$executeRaw`DELETE FROM "LedgerEntry" WHERE "id" = ${id}`;
}

export type LedgerLine = LedgerRow & { balanceKurus: number };

/** Her satıra o satıra kadar olan bakiyeyi ekler. Sonuncusu güncel bakiyedir. */
export function withRunningBalance(entries: LedgerRow[]): LedgerLine[] {
  let balance = 0;
  return entries.map((entry) => {
    balance += signedAmount(entry.kind, entry.amountKurus);
    return { ...entry, balanceKurus: balance };
  });
}

export function ledgerBalance(entries: LedgerRow[]): number {
  return entries.reduce(
    (sum, entry) => sum + signedAmount(entry.kind, entry.amountKurus),
    0,
  );
}
