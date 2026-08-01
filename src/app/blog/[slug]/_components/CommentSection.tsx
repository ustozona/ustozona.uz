"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { addCommentAction } from "@/server/actions/blog";
import type { BlogComment } from "@/server/dal/blog";

export function CommentSection({ postId, initialComments }: { postId: string; initialComments: BlogComment[] }) {
  const [comments, setComments] = useState(initialComments);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !body.trim()) return;
    startTransition(async () => {
      try {
        const comment = await addCommentAction({ postId, name, body });
        setComments((prev) => [...prev, comment]);
        setBody("");
        toast.success("Fikringiz qoʻshildi");
      } catch {
        toast.error("Xatolik yuz berdi, qayta urinib koʻring");
      }
    });
  };

  return (
    <section className="mt-14 border-t border-border pt-8">
      <h2 className="text-base font-semibold text-foreground">
        Fikrlar {comments.length > 0 && <span className="text-muted-foreground">({comments.length})</span>}
      </h2>

      <div className="mt-4 space-y-4">
        {comments.map((c) => (
          <div key={c.id} className="rounded-lg border border-border p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              {c.name}
              <span className="text-xs font-normal text-muted-foreground">
                {new Date(c.createdAt).toLocaleDateString("uz-UZ")}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{c.body}</p>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-2.5">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ismingiz"
          maxLength={80}
          required
        />
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Fikringizni yozing..."
          rows={3}
          maxLength={2000}
          required
        />
        <Button type="submit" disabled={pending}>
          Yuborish
        </Button>
      </form>
    </section>
  );
}
