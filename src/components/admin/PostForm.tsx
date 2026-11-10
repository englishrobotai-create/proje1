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
  };
};

export function PostForm({ mode, postId, defaults }: PostFormProps) {
  const action =
    mode === "edit" && postId
      ? updatePostAction.bind(null, postId)
      : createPostAction;

  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="admin-form">
      <label>
        Başlık
        <input
          name="title"
          required
          minLength={3}
          maxLength={160}
          defaultValue={defaults?.title}
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
          defaultValue={defaults?.excerpt}
        />
      </label>
      <label>
        İçerik
        <textarea
          name="content"
          required
          minLength={20}
          rows={12}
          defaultValue={defaults?.content}
        />
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          name="published"
          defaultChecked={defaults?.published ?? true}
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
