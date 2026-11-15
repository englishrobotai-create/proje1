import type { Post } from "@prisma/client";
import { ensureColumns, prisma } from "./db";

/**
 * Yazılara sonradan eklenen alanlar (SEO başlığı/açıklaması, eski adresler, yayın tarihi,
 * yazar). Post tablosunda ayrı sütunlardır ama ham SQL ile okunur/yazılır: Prisma istemcisi
 * yeniden üretilmemiş ve `prisma db push` yapılmamış olsa da çalışır (sütunlar ilk
 * kullanımda kendiliğinden eklenir).
 */
export type PostExtras = {
  seoTitle: string;
  seoDescription: string;
  /** Yazının eski adresleri (slug). Eski adrese gelen ziyaretçi yeni adrese yönlenir. */
  slugHistory: string[];
  /** İlk yayın tarihi (ISO metin). Boşsa oluşturma tarihi kullanılır. */
  publishedAt: string;
  /** Boşsa yazar olarak ofis adı kullanılır. */
  authorName: string;
};

export type PostWithExtras = Omit<Post, keyof PostExtras> & PostExtras;

export const EMPTY_EXTRAS: PostExtras = {
  seoTitle: "",
  seoDescription: "",
  slugHistory: [],
  publishedAt: "",
  authorName: "",
};

type ExtrasRow = {
  id: string;
  seoTitle: string | null;
  seoDescription: string | null;
  slugHistory: string | null;
  publishedAt: string | null;
  authorName: string | null;
};

export function parseSlugHistory(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function toExtras(row: ExtrasRow | undefined): PostExtras {
  if (!row) return { ...EMPTY_EXTRAS };
  return {
    seoTitle: row.seoTitle ?? "",
    seoDescription: row.seoDescription ?? "",
    slugHistory: parseSlugHistory(row.slugHistory),
    publishedAt: row.publishedAt ?? "",
    authorName: row.authorName ?? "",
  };
}

async function readAllExtras(): Promise<Map<string, PostExtras>> {
  try {
    await ensureColumns();
    const rows = await prisma.$queryRaw<ExtrasRow[]>`
      SELECT "id", "seoTitle", "seoDescription", "slugHistory", "publishedAt", "authorName"
      FROM "Post"
    `;
    return new Map(rows.map((row) => [row.id, toExtras(row)]));
  } catch {
    return new Map();
  }
}

export async function getPostExtras(id: string): Promise<PostExtras> {
  try {
    await ensureColumns();
    const rows = await prisma.$queryRaw<ExtrasRow[]>`
      SELECT "id", "seoTitle", "seoDescription", "slugHistory", "publishedAt", "authorName"
      FROM "Post" WHERE "id" = ${id} LIMIT 1
    `;
    return toExtras(rows[0]);
  } catch {
    return { ...EMPTY_EXTRAS };
  }
}

export async function savePostExtras(id: string, extras: PostExtras): Promise<void> {
  await ensureColumns();
  const history = extras.slugHistory.length > 0 ? JSON.stringify(extras.slugHistory) : "";
  await prisma.$executeRaw`
    UPDATE "Post" SET
      "seoTitle" = ${extras.seoTitle},
      "seoDescription" = ${extras.seoDescription},
      "slugHistory" = ${history},
      "publishedAt" = ${extras.publishedAt},
      "authorName" = ${extras.authorName}
    WHERE "id" = ${id}
  `;
}

function withExtras(post: Post, map: Map<string, PostExtras>): PostWithExtras {
  return { ...post, ...(map.get(post.id) ?? EMPTY_EXTRAS) } as PostWithExtras;
}

/** Yayın tarihi: kayıtlı ilk yayın tarihi, yoksa oluşturma tarihi. */
export function publishDate(post: { createdAt: Date; publishedAt: string }): Date {
  if (post.publishedAt) {
    const date = new Date(post.publishedAt);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return post.createdAt;
}

/** Son değişiklik tarihi; yayın tarihinden önce olamaz. */
export function modifiedDate(post: {
  createdAt: Date;
  updatedAt: Date;
  publishedAt: string;
}): Date {
  const published = publishDate(post);
  return post.updatedAt > published ? post.updatedAt : published;
}

export function formatPostDate(date: Date): string {
  return date.toLocaleDateString("tr-TR");
}

/** Yayındaki yazılar, en yeni yayın tarihli önce. Yazı sayısı az olduğundan bellekte sıralanır. */
export async function listPublishedPosts(
  options: { take?: number; excludeId?: string } = {},
): Promise<PostWithExtras[]> {
  const [posts, extras] = await Promise.all([
    prisma.post.findMany({ where: { published: true } }),
    readAllExtras(),
  ]);

  const sorted = posts
    .filter((post) => post.id !== options.excludeId)
    .map((post) => withExtras(post, extras))
    .sort((a, b) => publishDate(b).getTime() - publishDate(a).getTime());

  return options.take ? sorted.slice(0, options.take) : sorted;
}

export type PostLookup =
  | { kind: "found"; post: PostWithExtras }
  | { kind: "moved"; slug: string }
  | { kind: "missing" };

const SLUG_PATTERN = /^[a-z0-9-]{1,120}$/;

/** Adresten yazıyı bulur; eski bir adresse yeni adresi söyler. Taslaklar "missing" sayılır. */
export async function findPostBySlug(slug: string): Promise<PostLookup> {
  const direct = await prisma.post.findUnique({ where: { slug } });
  if (direct) {
    if (!direct.published) return { kind: "missing" };
    const extras = await getPostExtras(direct.id);
    return { kind: "found", post: { ...direct, ...extras } as PostWithExtras };
  }

  if (!SLUG_PATTERN.test(slug)) return { kind: "missing" };

  try {
    await ensureColumns();
    const needle = `"${slug}"`;
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "Post" WHERE instr("slugHistory", ${needle}) > 0 LIMIT 1
    `;
    if (rows[0]) {
      const moved = await prisma.post.findUnique({ where: { id: rows[0].id } });
      if (moved && moved.published) return { kind: "moved", slug: moved.slug };
    }
  } catch {
    // geçmiş okunamazsa 404 göster
  }
  return { kind: "missing" };
}

/** Yeni yazı formunda yazar alanını doldurmak için en son kullanılan yazar adı. */
export async function getLatestAuthorName(): Promise<string> {
  try {
    await ensureColumns();
    const rows = await prisma.$queryRaw<{ authorName: string }[]>`
      SELECT "authorName" FROM "Post" WHERE "authorName" <> '' ORDER BY "createdAt" DESC LIMIT 1
    `;
    return rows[0]?.authorName ?? "";
  } catch {
    return "";
  }
}
