import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { getAuthSecret } from "./auth-secret";
import { allowRequest } from "./rate-limit";

const COOKIE_NAME = "mm_session";

// Kayıtsız e-postayla yapılan denemeler de gerçek hesapla aynı sürede sonuçlansın.
const DUMMY_HASH = bcrypt.hashSync("kayitsiz-hesap-karsilastirmasi", 10);

function getSecret() {
  return new TextEncoder().encode(getAuthSecret());
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/** Şifre değişince eski oturumlar düşsün diye jetona şifre özetinin bir parçası konur. */
const passwordStamp = (passwordHash: string) =>
  createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);

export async function createSession(user: SessionUser, passwordHash: string) {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    v: passwordStamp(passwordHash),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  // Anahtar güvensizse sessizce "oturum yok" demek yerine açık hata versin.
  const secret = getSecret();

  try {
    const { payload } = await jwtVerify(token, secret);
    if (
      typeof payload.id !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string"
    ) {
      return null;
    }

    // Parmak izi olan oturumlar her istekte veritabanıyla doğrulanır: hesap silindiyse ya da
    // şifre değiştiyse oturum düşer. Parmak izi olmayanlar bu özellikten önce açılmış eski
    // oturumlardır; en geç 7 gün içinde kendiliğinden sona erer.
    if (typeof payload.v === "string") {
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, email: true, name: true, passwordHash: true },
      });
      if (!user || passwordStamp(user.passwordHash) !== payload.v) return null;
      return { id: user.id, email: user.email, name: user.name };
    }

    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
    };
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

async function clientIp(): Promise<string> {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

/**
 * Yönetici girişi hız sınırı: IP başına 15 dakikada 20, e-posta başına 15 dakikada 8 deneme.
 * (Adres alınamazsa herkes aynı kovaya düşer; sınır bu yüzden geniştir.)
 */
export async function allowAdminLoginAttempt(email: string): Promise<boolean> {
  const ip = await clientIp();
  const perIp = allowRequest(
    `admin-ip:${ip}`,
    ip === "unknown" ? 60 : 20,
    15 * 60_000,
  );
  const perEmail = allowRequest(
    `admin-mail:${email.trim().toLowerCase()}`,
    8,
    15 * 60_000,
  );
  return perIp && perEmail;
}

/** Hesap sayfasında mevcut şifre denemeleri: oturum sahibi başına 15 dakikada 5. */
export function allowAdminAccountAttempt(userId: string): boolean {
  return allowRequest(`admin-account:${userId}`, 5, 15 * 60_000);
}

export async function loginWithCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  // Kullanıcı yoksa da aynı sürede bir karşılaştırma yapılır (hesap var mı bilgisi sızmasın).
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return null;

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
  };
  await createSession(sessionUser, user.passwordHash);
  return sessionUser;
}
