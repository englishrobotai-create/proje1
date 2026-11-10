"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/settings";

const postSchema = z.object({
  title: z.string().trim().min(3, "Başlık en az 3 karakter olmalı").max(160),
  excerpt: z.string().trim().min(10, "Özet en az 10 karakter olmalı").max(320),
  content: z.string().trim().min(20, "İçerik en az 20 karakter olmalı"),
  published: z.boolean(),
});

export type PostState = {
  error?: string;
  success?: string;
};

async function uniqueSlug(base: string, excludeId?: string) {
  let slug = slugify(base) || "yazi";
  let i = 0;
  while (true) {
    const candidate = i === 0 ? slug : `${slug}-${i}`;
    const existing = await prisma.post.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    i += 1;
  }
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

  const parsed = postSchema.safeParse({
    title: formData.get("title"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    published: formData.get("published") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" };
  }

  const slug = await uniqueSlug(parsed.data.title);
  await prisma.post.create({
    data: {
      ...parsed.data,
      slug,
    },
  });

  revalidatePath("/blog");
  revalidatePath("/");
  revalidatePath("/admin/blog");
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

  const parsed = postSchema.safeParse({
    title: formData.get("title"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    published: formData.get("published") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" };
  }

  const slug = await uniqueSlug(parsed.data.title, postId);
  await prisma.post.update({
    where: { id: postId },
    data: {
      ...parsed.data,
      slug,
    },
  });

  revalidatePath("/blog");
  revalidatePath("/");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/admin/blog");
  redirect("/admin/blog");
}

export async function deletePostAction(postId: string) {
  await requireSession();
  await prisma.post.delete({ where: { id: postId } });
  revalidatePath("/blog");
  revalidatePath("/");
  revalidatePath("/admin/blog");
}

export async function togglePostPublishedAction(postId: string) {
  await requireSession();
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return;
  await prisma.post.update({
    where: { id: postId },
    data: { published: !post.published },
  });
  revalidatePath("/blog");
  revalidatePath("/");
  revalidatePath("/admin/blog");
}
