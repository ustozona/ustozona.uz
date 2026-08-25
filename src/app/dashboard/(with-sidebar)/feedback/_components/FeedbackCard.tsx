"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RichFeedbackText } from "@/components/feedback/rich-feedback-text";
import type { LinkRichInputHandle } from "@/components/feedback/link-rich-input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Collapsible, CollapsibleTrigger, CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Tooltip, TooltipTrigger, TooltipContent,
} from "@/components/ui/tooltip";
import { ImageZoom } from "@/components/kibo-ui/image-zoom";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MessageSquare, MoreHorizontal, Trash2, ChevronDown, ChevronRight,
  CornerUpLeft, Quote, Pencil,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type FeedbackItem, type FeedbackReply, type ReplyQuote,
  upvoteCount, isUpvotedByMe,
} from "@/store/useFeedbackStore";
import {
  useCategoryMeta, useStatusMeta, useMonthsShort,
  formatFeedbackFull,
} from "./feedback-meta";
import { ReactionChips, QuickReactionBar } from "./ReactionBar";
import { excerptOf } from "./QuoteBlock";
import { useQuoteSelection } from "./useQuoteSelection";
import ReplyRow from "./ReplyRow";
import ReplyComposer from "./ReplyComposer";
import UpVoteButton from "@/components/shadcn-space/button/button-21";

const badgeBase =
  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap";

/* OP avatar (lg = 40px) + gap-3 (12px) = 52px → matn shu qadar chapdan boshlanadi. */
const CONTENT_INDENT = "pl-[52px]";

type Props = {
  item: FeedbackItem;
  /** Kirish animatsiyasi uchun stagger indeksi. */
  index?: number;
  /** Deep-link (?item=) orqali kelinganda kartani yoritish. */
  flashOnMount?: boolean;
  /** Javob kompozeridagi avatar uchun (oddiy foydalanuvchi rejimi). */
  userInitials: string;
  onToggleReaction: (emoji: string) => void;
  onToggleReplyReaction: (replyId: string, emoji: string) => void;
  /** parentId — top-level ajdod ipi. */
  onAddReply: (body: string, quote?: ReplyQuote, parentId?: string) => void;
  /** Fikr matnini tahrirlash — `editedAt` yangilanadi. */
  onEdit: (body: string) => void;
  onDelete: () => void;
  /** Birinchi kartada tur (`feedback-upvote`) uchun `data-tour` belgisi. */
  tourTarget?: boolean;
};

export default function FeedbackCard({
  item, index = 0, flashOnMount = false, userInitials,
  onToggleReaction, onToggleReplyReaction, onAddReply, onEdit, onDelete, tourTarget = false,
}: Props) {
  const t = useTranslations("FeedbackCard");
  const categoryMeta = useCategoryMeta();
  const statusMeta = useStatusMeta();
  const monthsShort = useMonthsShort();
  const cat = categoryMeta[item.category];
  const status = statusMeta[item.status];
  const CatIcon = cat.icon;
  const images = item.images ?? [];
  const isMine = item.isMine ?? false;
  const replyCount = item.replies.length;

  // Ikki qatlam (YouTube): top-level javoblar + har biriga ichki javoblar.
  const topLevel = useMemo(() => item.replies.filter((r) => !r.parentId), [item.replies]);
  const childrenOf = useMemo(() => {
    const map = new Map<string, FeedbackReply[]>();
    for (const r of item.replies) {
      if (!r.parentId) continue;
      const arr = map.get(r.parentId) ?? [];
      arr.push(r);
      map.set(r.parentId, arr);
    }
    return map;
  }, [item.replies]);

  // Har bir fikr = bitta collapsible "mavzu". Javobi bor thread default ochiq.
  const [open, setOpen] = useState(replyCount > 0);
  // Yozilayotgan javob: parentId (top-level ajdod ipi) + belgilangan xabar.
  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<{ parentId?: string; quote?: ReplyQuote } | null>(null);
  // Yigʻilgan ichki iplar (default yopiq — YouTube uslubi).
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const textareaRef = useRef<LinkRichInputHandle>(null);
  const articleRef = useRef<HTMLElement>(null);
  const flashTimer = useRef<number | undefined>(undefined);

  // Iqtibos bosilganda belgilangan xabar "flash" bilan ajratiladi (React boshqaradi).
  const [flashId, setFlashId] = useState<string | null>(null);

  // Fikr matnini tahrirlash (inline) + oʻchirish tasdigʻi.
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(item.body);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const startEdit = () => {
    setEditDraft(item.body);
    setIsEditing(true);
  };
  const submitEdit = () => {
    const body = editDraft.trim();
    if (!body) return;
    onEdit(body);
    setIsEditing(false);
  };

  // Matn belgilash → suzuvchi "Iqtibos" tugmasi.
  const { sel, handleTextSelect, clearSelection } = useQuoteSelection(articleRef, item.author);

  // Deep-link (?item=) bilan kelinganda kartaning oʻzini yoritamiz.
  useEffect(() => {
    if (!flashOnMount) return;
    setFlashId(`msg-${item.id}`);
    flashTimer.current = window.setTimeout(() => setFlashId(null), 2000);
    return () => window.clearTimeout(flashTimer.current);
  }, [flashOnMount, item.id]);

  const expandThread = (parentId: string) =>
    setExpandedThreads((prev) => (prev.has(parentId) ? prev : new Set(prev).add(parentId)));

  const toggleThread = (parentId: string) =>
    setExpandedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) next.delete(parentId);
      else next.add(parentId);
      return next;
    });

  const jumpTo = (targetId?: string) => {
    if (!targetId) return;
    setOpen(true); // nishon yopiq suhbat ichida boʻlishi mumkin
    // Nishon yigʻilgan ichki javob boʻlsa — ajdod ipni ochamiz.
    const target = item.replies.find((r) => r.id === targetId.replace(/^msg-/, ""));
    if (target?.parentId) expandThread(target.parentId);
    requestAnimationFrame(() =>
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "center" })
    );
    setFlashId(targetId);
    window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setFlashId(null), 1500);
  };

  /** targetId (`msg-<id>`) uchun top-level ajdod id'si (OP body → undefined). */
  const parentIdForTarget = (targetId?: string): string | undefined => {
    if (!targetId) return undefined;
    const rid = targetId.replace(/^msg-/, "");
    if (rid === item.id) return undefined; // OP fikr → top-level javob
    const r = item.replies.find((x) => x.id === rid);
    return r ? r.parentId ?? r.id : undefined;
  };

  /** Kompozerni ochadi: parentId ipiga, ixtiyoriy iqtibos bilan. */
  const openComposer = (parentId?: string, quote?: ReplyQuote) => {
    setReplyingTo({ parentId, quote });
    setOpen(true);
    if (parentId) expandThread(parentId);
    // Kompozerga fokus (collapsible ochilgach / joyi oʻzgargach).
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  /** Bir javobga javob berish: shu ip ichida qoladi (2-daraja), iqtibos = oʻsha javob. */
  const replyToReply = (r: FeedbackReply) =>
    openComposer(r.parentId ?? r.id, {
      author: r.author,
      excerpt: excerptOf(r.body),
      targetId: `msg-${r.id}`,
    });

  const quoteSelection = () => {
    if (!sel) return;
    openComposer(parentIdForTarget(sel.targetId), {
      author: sel.author,
      excerpt: excerptOf(sel.text),
      targetId: sel.targetId,
    });
    clearSelection();
  };

  const submitReply = () => {
    const body = draft.trim();
    if (!body) return;
    onAddReply(body, replyingTo?.quote, replyingTo?.parentId);
    if (replyingTo?.parentId) expandThread(replyingTo.parentId);
    setDraft("");
    setReplyingTo(null);
  };

  const renderComposer = () => (
    <ReplyComposer
      quote={replyingTo?.quote}
      draft={draft}
      userInitials={userInitials}
      textareaRef={textareaRef}
      onDraftChange={setDraft}
      onClearTarget={() => setReplyingTo(null)}
      onSubmit={submitReply}
      onJump={jumpTo}
    />
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <article
          ref={articleRef}
          onMouseUp={handleTextSelect}
          style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
          className="group/card relative rounded-xl border border-border bg-card p-4 shadow-sm transition-[border-color,box-shadow,transform] duration-fast hover:border-primary/30 hover:shadow-md md:p-5 motion-safe:animate-fade-slide-up"
        >
          {/* Suzuvchi "Iqtibos bilan javob" tugmasi */}
          {sel && (
            <div
              className="absolute z-20 -translate-x-1/2 -translate-y-full animate-in fade-in-0 zoom-in-95 duration-fast"
              style={{ top: sel.top, left: sel.left }}
            >
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={quoteSelection}
                className="flex items-center gap-1.5 rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-semibold text-background shadow-lg transition-transform hover:scale-105 active:scale-95"
              >
                <Quote className="size-3.5" />
                {t("quoteReplyButton")}
              </button>
            </div>
          )}

          <Collapsible open={open} onOpenChange={setOpen}>
            {/* ── Sarlavha: avatar + ism/turkum/sana | holat + kebab (B: holat oʻngda) ── */}
            <div className="flex items-center gap-3">
              <Avatar size="lg" className="shrink-0">
                {item.authorAvatarUrl && <AvatarImage src={item.authorAvatarUrl} alt={item.author} />}
                <AvatarFallback className="bg-muted text-sm font-semibold text-muted-foreground">
                  {item.authorInitials}
                </AvatarFallback>
              </Avatar>

              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-semibold text-foreground">{item.author}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground/70">
                      {formatFeedbackFull(item.createdAt, monthsShort)}
                    </span>
                    {item.editedAt && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default text-xs text-muted-foreground/50">
                            {t("edited")}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{formatFeedbackFull(item.editedAt, monthsShort)}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <span className={cn(badgeBase, cat.pill)}>
                    <CatIcon className="size-3 shrink-0" />
                    {cat.label}
                  </span>
                  <span className={cn(badgeBase, status.pill)}>
                    <span className={cn("size-1.5 shrink-0 rounded-full", status.dot)} />
                    {status.label}
                  </span>
                  {isMine && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t("actionsAria")}
                          className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onSelect={startEdit}>
                          <Pencil className="size-4" /> {t("edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeleteConfirmOpen(true)}
                        >
                          <Trash2 className="size-4" /> {t("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>

            {/* ── Tana + reaksiyalar + suhbat (avatarga nisbatan chapdan tekis) ── */}
            <div className={cn("mt-3", CONTENT_INDENT)}>
              <div
                id={`msg-${item.id}`}
                data-msg-id={`msg-${item.id}`}
                data-msg-author={item.author}
                className={cn("group/msg", flashId === `msg-${item.id}` && "feedback-jump-flash")}
              >
                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      autoFocus
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setIsEditing(false);
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitEdit();
                      }}
                      className="min-h-20 text-sm"
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                        {t("cancel")}
                      </Button>
                      <Button size="sm" disabled={!editDraft.trim()} onClick={submitEdit}>
                        {t("save")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="max-w-[68ch] whitespace-pre-wrap text-sm leading-relaxed text-foreground selection:bg-primary/25">
                    <RichFeedbackText text={item.body} />
                  </p>
                )}
              </div>

              {images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {images.map((src, i) => (
                    <ImageZoom key={i} className="overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-85">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={t("imageAlt", { index: i + 1 })}
                        aria-label={t("imageZoomAria", { index: i + 1 })}
                        className="h-24 w-auto max-w-40 object-cover"
                      />
                    </ImageZoom>
                  ))}
                </div>
              )}

              {/* Ovoz + Reaksiya chiplari + Javob + Muhokama + tezkor reaksiya — bir qatorda (OP) */}
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
                <span {...(tourTarget ? { "data-tour": "feedback-upvote" } : {})}>
                  <UpVoteButton
                    voted={isUpvotedByMe(item)}
                    count={upvoteCount(item)}
                    onToggle={() => onToggleReaction("👍")}
                  />
                </span>
                <ReactionChips reactions={item.reactions} onToggle={onToggleReaction} />
                <button
                  type="button"
                  onClick={() => openComposer(undefined)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <CornerUpLeft className="size-3.5" />
                  {t("reply")}
                </button>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="group inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <MessageSquare className="size-3.5" />
                    {replyCount > 0 ? t("discussion", { count: replyCount }) : t("comments")}
                    <ChevronDown className="size-3.5 transition-transform duration-fast ease-standard group-data-[state=open]:rotate-180" />
                  </button>
                </CollapsibleTrigger>
                {!isEditing && (
                  <QuickReactionBar
                    onToggle={onToggleReaction}
                    className="ml-auto opacity-0 transition-opacity duration-fast group-hover/msg:opacity-100 focus-within:opacity-100"
                  />
                )}
              </div>

              {/* ── Suhbat: yassi izoh qatorlari + kompozer ── */}
              <CollapsibleContent className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1">
                <div className="mt-3.5 space-y-4 border-t border-border/60 pt-4">
                  {topLevel.map((tr) => {
                    const kids = childrenOf.get(tr.id) ?? [];
                    const expanded = expandedThreads.has(tr.id);
                    const composingHere = replyingTo?.parentId === tr.id;
                    return (
                      <div key={tr.id} className="space-y-3">
                        <ReplyRow
                          reply={tr}
                          flashId={flashId}
                          onToggleReaction={(emoji) => onToggleReplyReaction(tr.id, emoji)}
                          onReply={() => replyToReply(tr)}
                          onJump={jumpTo}
                        />

                        {/* Ichki javoblar ipi (avatar ostidan chekintirilgan) */}
                        {(kids.length > 0 || composingHere) && (
                          <div className="ml-11 space-y-3 border-l border-border/60 pl-4">
                            {kids.length > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleThread(tr.id)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary/90 transition-colors hover:text-primary"
                              >
                                <ChevronRight className={cn("size-3.5 transition-transform duration-fast ease-standard", expanded && "rotate-90")} />
                                {expanded ? t("hideReplies") : t("showReplies", { count: kids.length })}
                              </button>
                            )}
                            {expanded &&
                              kids.map((r) => (
                                <ReplyRow
                                  key={r.id}
                                  reply={r}
                                  flashId={flashId}
                                  onToggleReaction={(emoji) => onToggleReplyReaction(r.id, emoji)}
                                  onReply={() => replyToReply(r)}
                                  onJump={jumpTo}
                                />
                              ))}
                            {composingHere && renderComposer()}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Top-level javob kompozeri — faqat "Javob" bosilganda (pastda) */}
                  {replyingTo && !replyingTo.parentId && renderComposer()}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </article>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-52">
        <ContextMenuItem onSelect={() => openComposer(undefined)}>
          <CornerUpLeft className="size-4" /> {t("contextReply")}
        </ContextMenuItem>
        {isMine && (
          <>
            <ContextMenuItem onSelect={startEdit}>
              <Pencil className="size-4" /> {t("edit")}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem variant="destructive" onSelect={() => setDeleteConfirmOpen(true)}>
              <Trash2 className="size-4" /> {t("delete")}
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.desc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {t("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ContextMenu>
  );
}
