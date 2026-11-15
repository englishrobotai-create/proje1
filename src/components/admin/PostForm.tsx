"use client";

import { useActionState } from "react";
import {
  createPostAction,
  updatePostAction,
  type PostState,
} from "@/app/actions/posts";

const initial: PostState = {};

type PostFormProps = {
  mode: "create" | "edit";
  postId?: string;
  defaults?: {
    title: string;
    excerpt: string;
    content: string;
    published: boolean;
    slug: string;
    seoTitle: string;
    seoDescription: string;
    authorName: string;
  };
  /** Yeni yazıda yazar alanına önerilen ad (en son kullanılan). */
  suggestedAuthor?: string;
};

export function PostForm({
  mode,
  postId,
  defaults,
  suggestedAuthor,
}: PostFormProps) {
  const action =
    mode === "edit" && postId
      ? updatePostAction.bind(null, postId)
      : createPostAction;

  const [state, formAction, pending] = useActionState(action, initial);
  // Hata sonrası React formu varsayılan değerlere sıfırlar; yazılanlar kaybolmasın diye
  // sunucudan dönen değerler varsayılan olarak kullanılır.
  const v = state.values;

  return (
    <form action={formAction} className="admin-form">
      <label>
        Başlık
        <input
          name="title"
          required
          minLength={3}
          maxLength={160}
          defaultValue={v?.title ?? defaults?.title}
        />
      </label>
      <label>
        Özet
        <textarea
          name="excerpt"
          required
          minLength={10}
          maxLength={320}
          rows={3}
          defaultValue={v?.excerpt ?? defaults?.excerpt}
        />
      </label>
      <p className="form-hint" style={{ margin: "-0.5rem 0 0" }}>
        Özet, blog listesinde görünür. Arama sonuçlarında açıklama olarak ilk
        yaklaşık 160 karakteri gösterilir; ana fikri başa yazın.
      </p>
      <label>
        İçerik
        <textarea
          name="content"
          required
          minLength={20}
          rows={18}
          defaultValue={v?.content ?? defaults?.content}
        />
      </label>
      <p className="form-hint" style={{ margin: "-0.5rem 0 0" }}>
        Her satır ayrı bir paragraf olur. Biçim: <code>## Başlık</code>,{" "}
        <code>### Alt başlık</code>, <code>- madde</code>,{" "}
        <code>1. sıralı madde</code>, <code>**kalın**</code>,{" "}
        <code>[bağlantı metni](/iletisim)</code> (sayfa içi) veya{" "}
        <code>[kaynak](https://...)</code>. Uzun yazılarda ara başlıklar
        okuyucuya ve arama motoruna yol gösterir.
      </p>

      <h3 className="admin-subtitle">Arama motoru ve yazar (isteğe bağlı)</h3>
      <label>
        Adres
        <input
          name="slug"
          maxLength={120}
          placeholder={mode === "create" ? "Boşsa başlıktan üretilir" : undefined}
          defaultValue={v?.slug ?? defaults?.slug}
        />
      </label>
      <p className="form-hint" style={{ margin: "-0.5rem 0 0" }}>
        Yazının internet adresidir (<code>/blog/adres</code>). Başlığı
        düzeltmeniz adresi değiştirmez. Adresi siz değiştirirseniz eski adres
        otomatik olarak yenisine yönlenir.
      </p>
      <label>
        SEO başlığı
        <input
          name="seoTitle"
          maxLength={70}
          placeholder="Boşsa yazı başlığı kullanılır"
          defaultValue={v?.seoTitle ?? defaults?.seoTitle}
        />
      </label>
      <label>
        SEO açıklaması
        <textarea
          name="seoDescription"
          rows={2}
          maxLength={160}
          placeholder="Boşsa özet kullanılır"
          defaultValue={v?.seoDescription ?? defaults?.seoDescription}
        />
      </label>
      <p className="form-hint" style={{ margin: "-0.5rem 0 0" }}>
        Arama sonucunda görünen başlık (en çok yaklaşık 60 karakter) ve açıklama
        (en çok 160 karakter). Boş bırakırsanız başlık ve özet kullanılır.
      </p>
      <label>
        Yazar
        <input
          name="authorName"
          maxLength={80}
          placeholder="Boşsa ofis adı yazar olarak gösterilir"
          defaultValue={v?.authorName ?? defaults?.authorName ?? suggestedAuthor}
        />
      </label>

      <label className="checkbox-row">
        <input
          type="checkbox"
          name="published"
          defaultChecked={v?.published ?? defaults?.published ?? true}
        />
        Yayında
      </label>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Kaydediliyor..." : mode === "edit" ? "Güncelle" : "Yayınla"}
      </button>
    </form>
  );
}
