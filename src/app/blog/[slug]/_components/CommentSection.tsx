"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { initialsOf } from "@/store/useFeedbackStore";
import { formatFullDateUz } from "@/lib/localization";
import { addCommentAction } from "@/server/actions/blog";
import type { BlogComment } from "@/server/dal/blog";

export type CommentViewer = { name: string; avatarUrl: string | null };

/* Fikr bildirish HISOB talab qiladi. Ilgari ism erkin matn maydoni edi —
   istalgan odam istalgan nom bilan yozardi, javobgarlik ham, spamdan
   himoya ham yoʻq edi. Medium, Substack, Ghost, Dev.to — hammasi hisob
   talab qiladi, biz ham shu yoʻlga oʻtdik.

   Kirmagan oʻquvchiga forma OʻCHIRILGAN holda koʻrsatilmaydi (sababsiz
   disabled CTA — dizayn tizimida taqiqlangan naqsh): uning oʻrniga nima
   qilish kerakligi ochiq aytiladi va ikkita yoʻl beriladi.

   ⚠️ Kirgandan keyin odam maqolaga QAYTMAYDI — `/dashboard` ga tushadi.
   `?next=` qoʻshilmadi, chunki `postAuthRedirect` (lib/pending-link.ts)
   hozircha bunday parametrni oʻqimaydi; ishlamaydigan parametr qoʻyish
   uni ishlaydi deb oʻylashga sabab boʻlardi. Buni tuzatish auth oqimiga
   tegadi (ochiq-redirect tekshiruvi ham kerak) — alohida ish. */
export function CommentSection({
  postId,
  initialComments,
  viewer,
}: {
  postId: string;
  initialComments: BlogComment[];
  viewer: CommentViewer | null;
}) {
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      try {
        const comment = await addCommentAction({ postId, body });
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

      <div className="mt-5 space-y-5">
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground">Hozircha fikr yoʻq. Birinchi boʻling.</p>
        )}
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar className="size-8 shrink-0">
              {c.authorAvatarUrl && (
                <AvatarImage src={c.authorAvatarUrl} alt={c.name} referrerPolicy="no-referrer" />
              )}
              <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
                {initialsOf(c.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm font-medium text-foreground">{c.name}</span>
                <span className="text-xs text-muted-foreground">{formatFullDateUz(c.createdAt)}</span>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground">{c.body}</p>
            </div>
          </div>
        ))}
      </div>

      {viewer ? (
        <form onSubmit={submit} className="mt-8 flex gap-3">
          <Avatar className="size-8 shrink-0">
            {viewer.avatarUrl && (
              <AvatarImage src={viewer.avatarUrl} alt={viewer.name} referrerPolicy="no-referrer" />
            )}
            <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
              {initialsOf(viewer.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2.5">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Fikringizni yozing..."
              maxLength={2000}
              rows={3}
              required
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {viewer.name} nomidan yoziladi
              </span>
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Yuborilmoqda..." : "Yuborish"}
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mt-8 rounded-lg border border-border bg-muted/40 px-4 py-5 text-center">
          <p className="text-sm font-medium text-foreground">Fikr bildirish uchun hisobingizga kiring</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Shunda fikringiz ismingiz va rasmingiz bilan koʻrinadi.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button asChild size="sm">
              <Link href="/register">Roʻyxatdan oʻtish</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Kirish</Link>
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
