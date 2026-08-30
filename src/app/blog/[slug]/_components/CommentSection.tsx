"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MoreHorizontal } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { initialsOf } from "@/store/useFeedbackStore";
import { formatFullDateUz } from "@/lib/localization";
import { relativeTimeUz } from "@/lib/relative-time";
import { addCommentAction, deleteCommentAction, editCommentAction } from "@/server/actions/blog";
import type { BlogComment } from "@/server/dal/blog";

export type CommentViewer = { name: string; avatarUrl: string | null };

/* Fikrlar boʻlimi — Substack/Ghost naqshi (docs/blog-nashr-modeli.md §13):
   kompozer fokusgacha bitta qator; ism ostida nisbiy vaqt; oʻz fikrini
   tahrirlash/oʻchirish; maqola muallifi moderatsiyasi; «Muallif» chipi;
   bir daraja javob; «Eng yangi / Eng eski» saralash. Ogʻir «quti» yoʻq —
   faqat fikrlar orasida soch chizigʻi.

   Kirmagan oʻquvchiga forma OʻCHIRILGAN holda koʻrsatilmaydi (sababsiz
   disabled CTA — dizayn tizimida taqiqlangan): nima qilish kerakligi
   ochiq aytiladi.

   ⚠️ Kirgandan keyin odam maqolaga QAYTMAYDI — `/dashboard` ga tushadi
   (`postAuthRedirect` `?next=` ni hali oʻqimaydi — alohida ish). */
export function CommentSection({
  postId,
  initialComments,
  canModerate,
  viewer,
}: {
  postId: string;
  initialComments: BlogComment[];
  canModerate: boolean;
  viewer: CommentViewer | null;
}) {
  const [comments, setComments] = useState(initialComments);
  const [sort, setSort] = useState<"new" | "old">("new");

  const { roots, repliesOf } = useMemo(() => {
    const replies = new Map<string, BlogComment[]>();
    const rootList: BlogComment[] = [];
    for (const c of comments) {
      if (c.parentId) {
        const arr = replies.get(c.parentId) ?? [];
        arr.push(c);
        replies.set(c.parentId, arr);
      } else {
        rootList.push(c);
      }
    }
    rootList.sort((a, b) =>
      sort === "new"
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt),
    );
    for (const arr of replies.values()) arr.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return { roots: rootList, repliesOf: replies };
  }, [comments, sort]);

  const visibleCount = comments.filter((c) => !c.deleted).length;

  const applyAdd = (comment: BlogComment) => setComments((prev) => [...prev, comment]);

  const applyEdit = (id: string, body: string, editedAt: string) =>
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, body, editedAt } : c)));

  const applyDelete = (id: string) =>
    setComments((prev) => {
      const hasLiveReply = prev.some((c) => c.parentId === id && !c.deleted);
      if (hasLiveReply) {
        return prev.map((c) => (c.id === id ? { ...c, deleted: true, body: "" } : c));
      }
      return prev.filter((c) => c.id !== id);
    });

  return (
    <section className="mt-14 border-t border-border pt-8">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">
          Fikrlar{" "}
          {visibleCount > 0 && <span className="text-muted-foreground">· {visibleCount}</span>}
        </h2>
        {roots.length > 1 && (
          <button
            type="button"
            onClick={() => setSort((s) => (s === "new" ? "old" : "new"))}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {sort === "new" ? "Eng yangi" : "Eng eski"}
          </button>
        )}
      </div>

      {viewer ? (
        <div className="mt-5">
          <Composer
            viewer={viewer}
            placeholder="Fikr yozing…"
            note={`${viewer.name} nomidan yoziladi`}
            onSubmit={(body) => addCommentAction({ postId, body })}
            onDone={applyAdd}
          />
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-border bg-muted/40 px-4 py-5 text-center">
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

      {/* Kompozer ↔ birinchi fikr: yagona soch chizigʻi ajratadi, keyin
          har fikr `divide-y` bilan bir tekis oraliqda (Ghost/Substack
          naqshi) — ilgari `mt-2` + `first:pt-0` fikrni kompozerga
          yopishtirib qoʻyardi. */}
      <div className="mt-6 border-t border-border">
        {roots.length === 0 ? (
          <p className="py-8 text-sm text-muted-foreground">Hozircha fikr yoʻq. Birinchi boʻling.</p>
        ) : (
          <div className="divide-y divide-border">
            {roots.map((root) => (
              <Thread
                key={root.id}
                root={root}
                replies={repliesOf.get(root.id) ?? []}
                postId={postId}
                canModerate={canModerate}
                viewer={viewer}
                onAdd={applyAdd}
                onEdit={applyEdit}
                onDelete={applyDelete}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Thread({
  root,
  replies,
  postId,
  canModerate,
  viewer,
  onAdd,
  onEdit,
  onDelete,
}: {
  root: BlogComment;
  replies: BlogComment[];
  postId: string;
  canModerate: boolean;
  viewer: CommentViewer | null;
  onAdd: (c: BlogComment) => void;
  onEdit: (id: string, body: string, editedAt: string) => void;
  onDelete: (id: string) => void;
}) {
  const [replying, setReplying] = useState(false);

  return (
    <div className="py-6">
      <CommentRow
        comment={root}
        canModerate={canModerate}
        onReply={viewer ? () => setReplying((v) => !v) : undefined}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {replying && viewer && (
        <div className="ml-11 mt-3">
          <Composer
            viewer={viewer}
            placeholder="Javob yozing…"
            small
            onSubmit={(body) => addCommentAction({ postId, body, parentId: root.id })}
            onDone={(c) => {
              onAdd(c);
              setReplying(false);
            }}
            onCancel={() => setReplying(false)}
          />
        </div>
      )}

      {replies.length > 0 && (
        <div className="ml-7 mt-4 flex flex-col gap-5 border-l border-border pl-4">
          {replies.map((r) => (
            <CommentRow
              key={r.id}
              comment={r}
              canModerate={canModerate}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentRow({
  comment,
  canModerate,
  onReply,
  onEdit,
  onDelete,
}: {
  comment: BlogComment;
  canModerate: boolean;
  onReply?: () => void;
  onEdit: (id: string, body: string, editedAt: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [pending, startTransition] = useTransition();

  const canEdit = comment.mine && !comment.deleted;
  const canDelete = (comment.mine || canModerate) && !comment.deleted;

  const submitEdit = () => {
    const body = editBody.trim();
    if (!body || body === comment.body) {
      setEditing(false);
      return;
    }
    startTransition(async () => {
      try {
        const { editedAt } = await editCommentAction({ commentId: comment.id, body });
        onEdit(comment.id, body, editedAt);
        setEditing(false);
      } catch {
        toast.error("Tahrirlab boʻlmadi");
      }
    });
  };

  const remove = () => {
    startTransition(async () => {
      try {
        await deleteCommentAction(comment.id);
        onDelete(comment.id);
      } catch {
        toast.error("Oʻchirib boʻlmadi");
      }
    });
  };

  return (
    <div className="group flex gap-3">
      <Avatar className="size-8 shrink-0">
        {comment.authorAvatarUrl && (
          <AvatarImage src={comment.authorAvatarUrl} alt={comment.name} referrerPolicy="no-referrer" />
        )}
        <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
          {initialsOf(comment.name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground">{comment.name}</span>
          {comment.isPostAuthor && (
            <span className="rounded border border-border px-1.5 py-px text-[10px] font-medium text-muted-foreground">
              Muallif
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground" title={formatFullDateUz(comment.createdAt)}>
          <RelativeTime iso={comment.createdAt} />
          {comment.editedAt && !comment.deleted && <span> · tahrirlangan</span>}
        </div>

        {comment.deleted ? (
          <p className="mt-1.5 text-sm italic text-muted-foreground">[oʻchirilgan]</p>
        ) : editing ? (
          <div className="mt-2 space-y-2">
            <Textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              maxLength={2000}
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={submitEdit} disabled={pending}>
                Saqlash
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditBody(comment.body);
                  setEditing(false);
                }}
              >
                Bekor
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground">
            {comment.body}
          </p>
        )}

        {!comment.deleted && !editing && onReply && (
          <button
            type="button"
            onClick={onReply}
            className="mt-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Javob berish
          </button>
        )}
      </div>

      {(canEdit || canDelete) && !editing && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {/* `self-start` — qator `items-stretch` boʻlgani uchun tugma
                butun fikr balandligiga choʻzilib, hover foni ulkan
                toʻrtburchak boʻlib koʻrinardi; endi avatar bilan bir
                qatorda, 32px kvadrat (`icon-sm`, dizayn tizimi). */}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Amallar"
              className={cn(
                "shrink-0 self-start text-muted-foreground",
                "opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100",
                "data-[state=open]:opacity-100 max-sm:opacity-100",
              )}
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canEdit && <DropdownMenuItem onClick={() => setEditing(true)}>Tahrirlash</DropdownMenuItem>}
            <DropdownMenuItem variant="destructive" onClick={remove}>
              {comment.mine ? "Oʻchirish" : "Oʻchirish (muallif sifatida)"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

function Composer({
  viewer,
  placeholder,
  note,
  small,
  onSubmit,
  onDone,
  onCancel,
}: {
  viewer: CommentViewer;
  placeholder: string;
  note?: string;
  small?: boolean;
  onSubmit: (body: string) => Promise<BlogComment>;
  onDone: (c: BlogComment) => void;
  onCancel?: () => void;
}) {
  const [open, setOpen] = useState(Boolean(small));
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    const value = body.trim();
    if (!value) return;
    startTransition(async () => {
      try {
        const comment = await onSubmit(value);
        setBody("");
        setOpen(Boolean(small));
        onDone(comment);
      } catch {
        toast.error("Xatolik yuz berdi, qayta urinib koʻring");
      }
    });
  };

  return (
    <div className="flex gap-3">
      <Avatar className="size-8 shrink-0">
        {viewer.avatarUrl && (
          <AvatarImage src={viewer.avatarUrl} alt={viewer.name} referrerPolicy="no-referrer" />
        )}
        <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
          {initialsOf(viewer.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            if (!body.trim() && !small) setOpen(false);
          }}
          placeholder={placeholder}
          maxLength={2000}
          rows={open ? 3 : 1}
          className={cn(!open && "min-h-0 resize-none py-2")}
        />
        {open && (
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {2000 - body.length < 200 ? `${2000 - body.length} belgi qoldi` : note}
            </span>
            <div className="flex gap-2">
              {(onCancel || !small) && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setBody("");
                    setOpen(Boolean(small));
                    onCancel?.();
                  }}
                >
                  Bekor
                </Button>
              )}
              <Button type="button" size="sm" onClick={submit} disabled={pending}>
                {pending ? "Yuborilmoqda…" : "Yuborish"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** SSR paytida toʻliq sana, mount'dan keyin nisbiy vaqt — hidratsiya
 *  nomuvofiqligi boʻlmasin (server va klient soati farq qiladi). */
function RelativeTime({ iso }: { iso: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <span suppressHydrationWarning>{mounted ? relativeTimeUz(iso) : formatFullDateUz(iso)}</span>
  );
}
