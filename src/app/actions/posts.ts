"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPostExtras, savePostExtras } from "@/lib/posts";
import { slugify } from "@/lib/settings";

const postSchema = z.object({
  title: z.string().trim().min(3, "Başlık en az 3 karakter olmalı").max(160),
  excerpt: z.string().trim().min(10, "Özet en az 10 karakter olmalı").max(320),
  content: z.string().trim().min(20, "İçerik en az 20 karakter olmalı"),
  published: z.boolean(),
  slug: z.string().trim().max(120, "Adres en çok 120 karakter olmalı"),
  seoTitle: z.string().trim().max(70, "SEO başlığı en çok 70 karakter olmalı"),
  seoDescription: z
    .string()
    .trim()
    .max(160, "SEO açıklaması en çok 160 karakter olmalı"),
  authorName: z.string().trim().max(80, "Yazar adı en çok 80 karakter olmalı"),
});

/** Gönderilen değerler; hata olunca form boşalmasın diye geri döndürülür. */
export type PostValues = {
  title: string;
  excerpt: string;
  content: string;
  published: boolean;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  authorName: string;
};

export type PostState = {
  error?: string;
  success?: string;
  values?: PostValues;
};

function readValues(formData: FormData): PostValues {
  const text = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  return {
    title: text("title"),
    excerpt: text("excerpt"),
    content: text("content"),
    published: formData.get("published") === "on",
    slug: text("slug"),
    seoTitle: text("seoTitle"),
    seoDescription: text("seoDescription"),
    authorName: text("authorName"),
  };
}

async function isSlugTaken(slug: string, excludeId?: string) {
  const existing = await prisma.post.findUnique({ where: { slug } });
  return Boolean(existing && existing.id !== excludeId);
}

/** Başlıktan üretilen adres doluysa sonuna -1, -2 ... ekler. */
async function uniqueSlug(base: string) {
  const slug = slugify(base) || "yazi";
  let i = 0;
  while (true) {
    const candidate = i === 0 ? slug : `${slug}-${i}`;
    if (!(await isSlugTaken(candidate))) return candidate;
    i += 1;
  }
}

function revalidateBlog() {
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page"); // "diğer yazılar" listesi her yazı sayfasında yer alır
  revalidatePath("/blog/feed.xml");
  revalidatePath("/");
  revalidatePath("/admin/blog");
}

export async function createPostAction(
  _prev: PostState,
  formData: FormData,
): Promise<PostState> {
  try {
    await requireSession();
  } catch {
    return { error: "Oturum gerekli" };
  }

  const values = readValues(formData);
  const parsed = postSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz veri", values };
  }
  const { slug: slugInput, seoTitle, seoDescription, authorName, ...data } =
    parsed.data;

  let slug: string;
  if (slugInput) {
    slug = slugify(slugInput);
    if (!slug) return { error: "Adres için harf veya rakam girin", values };
    if (await isSlugTaken(slug)) {
      return { error: "Bu adres başka bir yazıda kullanılıyor", values };
    }
  } else {
    slug = await uniqueSlug(data.title);
  }

  const created = await prisma.post.create({ data: { ...data, slug } });
  await savePostExtras(created.id, {
    seoTitle,
    seoDescription,
    authorName,
    slugHistory: [],
    publishedAt: data.published ? new Date().toISOString() : "",
  });

  revalidateBlog();
  redirect("/admin/blog");
}

export async function updatePostAction(
  postId: string,
  _prev: PostState,
  formData: FormData,
): Promise<PostState> {
  try {
    await requireSession();
  } catch {
    return { error: "Oturum gerekli" };
  }

  const values = readValues(formData);
  const parsed = postSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz veri", values };
  }
  const { slug: slugInput, seoTitle, seoDescription, authorName, ...data } =
    parsed.data;

  const existing = await prisma.post.findUnique({ where: { id: postId } });
  if (!existing) return { error: "Yazı bulunamadı", values };
  const extras = await getPostExtras(postId);

  // Başlık değişse de adres kendiliğinden değişmez; yalnızca adres alanı elle değiştirilirse
  // değişir ve eski adres yeni adrese yönlenir (arama sonuçlarındaki bağlantılar bozulmasın).
  let slug = existing.slug;
  let history = extras.slugHistory;
  const requested = slugify(slugInput);
  if (slugInput && !requested) {
    return { error: "Adres için harf veya rakam girin", values };
  }
  if (requested && requested !== existing.slug) {
    if (await isSlugTaken(requested, postId)) {
      return { error: "Bu adres başka bir yazıda kullanılıyor", values };
    }
    history = [...history.filter((item) => item !== requested), existing.slug].slice(-20);
    slug = requested;
  }

  // İlk yayın tarihi: taslakken yayına alınan yazıda o an kaydedilir, sonra değişmez.
  const publishedAt =
    data.published && !existing.published && !extras.publishedAt
      ? new Date().toISOString()
      : extras.publishedAt;

  await prisma.post.update({ where: { id: postId }, data: { ...data, slug } });
  await savePostExtras(postId, {
    seoTitle,
    seoDescription,
    authorName,
    slugHistory: history,
    publishedAt,
  });

  revalidateBlog();
  redirect("/admin/blog");
}

export async function deletePostAction(postId: string) {
  await requireSession();
  await prisma.post.delete({ where: { id: postId } });
  revalidateBlog();
}

export async function togglePostPublishedAction(postId: string) {
  await requireSession();
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return;
  const nowPublished = !post.published;
  await prisma.post.update({
    where: { id: postId },
    data: { published: nowPublished },
  });
  if (nowPublished) {
    const extras = await getPostExtras(postId);
    if (!extras.publishedAt) {
      await savePostExtras(postId, {
        ...extras,
        publishedAt: new Date().toISOString(),
      });
    }
  }
  revalidateBlog();
}
