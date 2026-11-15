import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import {
  getMukellefAuth,
  getMukellefAuthByEmail,
  isPortalEnabled,
  touchLogin,
  type MukellefAuth,
} from "./portal-db";
import { allowRequest } from "./rate-limit";
import { getAuthSecret } from "./auth-secret";

/**
 * Mükellef oturumu. Yönetici oturumundan (auth.ts) bilinçli olarak ayrıdır:
 *  - Ayrı çerez (mm_mukellef) ve yalnızca /mukellef yoluna gönderilir.
 *  - JWT, AUTH_SECRET'tan türetilmiş ayrı bir anahtarla imzalanır; yönetici anahtarıyla
 *    doğrulanamaz, yönetici jetonu da burada geçmez. Ayrıca `aud` ve `typ` alanları denetlenir.
 *  - Her istekte mükellefin hâlâ var, etkin ve şifresinin değişmemiş olduğu veritabanından doğrulanır.
 */

export const PORTAL_COOKIE = "mm_mukellef";
const PORTAL_PATH = "/mukellef";
const AUDIENCE = "mukellef-portal";
const SESSION_SECONDS = 60 * 60 * 12;

function getPortalKey(): Uint8Array {
  const secret = getAuthSecret();
  return new TextEncoder().encode(
    createHash("sha256").update(`mukellef:${secret}`).digest("hex"),
  );
}

/** Şifre değişince eski oturumlar düşsün diye jetona şifre özetinin bir parçası konur. */
const passwordStamp = (passwordHash: string) =>
  createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);

export type PortalSession = {
  id: string;
  name: string;
  email: string;
};

export async function createPortalSession(mukellef: MukellefAuth) {
  const token = await new SignJWT({ typ: "mukellef", pwv: passwordStamp(mukellef.passwordHash) })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(mukellef.id)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_SECONDS}s`)
    .sign(getPortalKey());

  const cookieStore = await cookies();
  cookieStore.set(PORTAL_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: PORTAL_PATH,
    maxAge: SESSION_SECONDS,
  });
}

export async function destroyPortalSession() {
  const cookieStore = await cookies();
  cookieStore.delete({ name: PORTAL_COOKIE, path: PORTAL_PATH });
}

export async function getPortalSession(): Promise<PortalSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getPortalKey(), {
      algorithms: ["HS256"],
      audience: AUDIENCE,
    });
    if (payload.typ !== "mukellef" || typeof payload.sub !== "string") return null;
    if (typeof payload.pwv !== "string") return null;
    if (!(await isPortalEnabled())) return null;

    const mukellef = await getMukellefAuth(payload.sub);
    if (!mukellef || !mukellef.active || !mukellef.hasPassword) return null;
    if (passwordStamp(mukellef.passwordHash) !== payload.pwv) return null;
    return { id: mukellef.id, name: mukellef.name, email: mukellef.email };
  } catch {
    return null;
  }
}

// ---- Şifre ----

export const hashPortalPassword = (password: string) => bcrypt.hash(password, 12);

// Kayıtsız e-postayla yapılan denemeler de gerçek hesapla aynı sürede sonuçlansın.
const DUMMY_HASH = bcrypt.hashSync("kayitsiz-hesap-karsilastirmasi", 12);

// ---- Giriş ----

async function clientIp(): Promise<string> {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

/**
 * Hız sınırı: IP başına 10 dakikada 20, e-posta başına 15 dakikada 8 deneme.
 * (Adres alınamazsa herkes aynı kovaya düşer; sınır bu yüzden geniştir.)
 */
export async function allowPortalAttempt(email: string): Promise<boolean> {
  const ip = await clientIp();
  const perIp = allowRequest(`portal-ip:${ip}`, ip === "unknown" ? 60 : 20, 10 * 60_000);
  const perEmail = allowRequest(`portal-mail:${email}`, 8, 15 * 60_000);
  return perIp && perEmail;
}

export async function allowPortalReset(email: string): Promise<boolean> {
  const ip = await clientIp();
  const perIp = allowRequest(`portal-reset-ip:${ip}`, ip === "unknown" ? 30 : 5, 15 * 60_000);
  const perEmail = allowRequest(`portal-reset-mail:${email}`, 3, 60 * 60_000);
  return perIp && perEmail;
}

/** Başarılıysa oturum açar ve mükellefi döndürür; hata nedeni dışarı sızdırılmaz. */
export async function loginMukellef(
  email: string,
  password: string,
): Promise<MukellefAuth | null> {
  const mukellef = await getMukellefAuthByEmail(email);
  const hash = mukellef?.hasPassword ? mukellef.passwordHash : DUMMY_HASH;
  const matches = await bcrypt.compare(password, hash);
  if (!mukellef || !mukellef.active || !mukellef.hasPassword || !matches) return null;

  await createPortalSession(mukellef);
  await touchLogin(mukellef.id);
  return mukellef;
}

/** Sunucu işlemleri ve sayfalar için: oturum yoksa fırlatır. */
export async function requirePortalSession(): Promise<PortalSession> {
  const session = await getPortalSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}
