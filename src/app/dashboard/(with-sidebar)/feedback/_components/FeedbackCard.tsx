"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Collapsible, CollapsibleTrigger, CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Tooltip, TooltipTrigger, TooltipContent,
} from "@/components/ui/tooltip";
import {
  Dialog, DialogTrigger, DialogContent, DialogTitle,
} from "@/components/ui/dialog";
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
import {
  type FeedbackItem, type FeedbackReply, type ReplyQuote,
  upvoteCount, isUpvotedByMe,
} from "@/store/useFeedbackStore";
import {
  CATEGORY_META, STATUS_META, formatFeedbackAgo, formatFeedbackFull,
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
  /** Joriy foydalanuvchining profil rasmi (Sozlamalar > Profil). */
  userAvatarUrl?: string;
  onToggleReaction: (emoji: string) => void;
  onToggleReplyReaction: (replyId: string, emoji: string) => void;
  /** asTeam — rasmiy (jamoa) javob; parentId — top-level ajdod ipi. */
  onAddReply: (body: string, asTeam: boolean, quote?: ReplyQuote, parentId?: string) => void;
  /** Fikr matnini tahrirlash — `editedAt` yangilanadi. */
  onEdit: (body: string) => void;
  onDelete: () => void;
  /** Birinchi kartada tur (`feedback-upvote`) uchun `data-tour` belgisi. */
  tourTarget?: boolean;
};

export default function FeedbackCard({
  item, index = 0, flashOnMount = false, userInitials, userAvatarUrl,
  onToggleReaction, onToggleReplyReaction, onAddReply, onEdit, onDelete, tourTarget = false,
}: Props) {
  const cat = CATEGORY_META[item.category];
  const status = STATUS_META[item.status];
  const CatIcon = cat.icon;
  const images = item.images ?? [];
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
  // Javob rejimi: jamoa (rasmiy, default — asoschi rejimi) yoki oddiy user.
  const [asTeam, setAsTeam] = useState(true);
  const [replyingTo, setReplyingTo] = useState<{ parentId?: string; quote?: ReplyQuote } | null>(null);
  // Yigʻilgan ichki iplar (default yopiq — YouTube uslubi).
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
    onAddReply(body, asTeam, replyingTo?.quote, replyingTo?.parentId);
    if (replyingTo?.parentId) expandThread(replyingTo.parentId);
    setDraft("");
    setReplyingTo(null);
  };

  const renderComposer = () => (
    <ReplyComposer
      quote={replyingTo?.quote}
      draft={draft}
      asTeam={asTeam}
      userInitials={userInitials}
      textareaRef={textareaRef}
      onDraftChange={setDraft}
      onAsTeamChange={setAsTeam}
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
                Iqtibos bilan javob
              </button>
            </div>
          )}

          <Collapsible open={open} onOpenChange={setOpen}>
            {/* ── Sarlavha: avatar + ism/turkum/sana | holat + kebab (B: holat oʻngda) ── */}
            <div className="flex items-center gap-3">
              <Avatar size="lg" className="shrink-0">
                {userAvatarUrl && <AvatarImage src={userAvatarUrl} alt={item.author} />}
                <AvatarFallback className="bg-muted text-sm font-semibold text-muted-foreground">
                  {item.authorInitials}
                </AvatarFallback>
              </Avatar>

              <div className="flex min-w-0 flex-1 items-center gap-2">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-semibold text-foreground">{item.author}</span>
                  <div className="flex items-center gap-1.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-default text-xs text-muted-foreground/70">
                          {formatFeedbackAgo(item.createdAt)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{formatFeedbackFull(item.createdAt)}</TooltipContent>
                    </Tooltip>
                    {item.editedAt && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default text-xs text-muted-foreground/50">
                            · tahrirlangan
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{formatFeedbackFull(item.editedAt)}</TooltipContent>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Fikr amallari"
                        className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onSelect={startEdit}>
                        <Pencil className="size-4" /> Tahrirlash
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => setDeleteConfirmOpen(true)}
                      >
                        <Trash2 className="size-4" /> Oʻchirish
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* ── Tana + reaksiyalar + suhbat (avatarga nisbatan chapdan tekis) ── */}
            <div className={cn("mt-2", CONTENT_INDENT)}>
              <div
                id={`msg-${item.id}`}
                data-msg-id={`msg-${item.id}`}
                data-msg-author={item.author}
                className={cn("group/msg relative", flashId === `msg-${item.id}` && "feedback-jump-flash")}
              >
                {/* Hover'da tezkor reaksiya paneli (Slack/Telegram uslubi) */}
                {!isEditing && (
                  <QuickReactionBar
                    onToggle={onToggleReaction}
                    className="absolute -top-2 right-0 z-10 opacity-0 transition-opacity duration-fast group-hover/msg:opacity-100 focus-within:opacity-100"
                  />
                )}
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
                        Bekor qilish
                      </Button>
                      <Button size="sm" disabled={!editDraft.trim()} onClick={submitEdit}>
                        Saqlash
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 selection:bg-primary/25">
                    {item.body}
                  </p>
                )}
              </div>

              {images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {images.map((src, i) => (
                    <Dialog key={i}>
                      <DialogTrigger asChild>
                        <button
                          type="button"
                          aria-label={`${i + 1}-rasmni kattalashtirish`}
                          className="overflow-hidden rounded-lg border border-border transition-opacity hover:opacity-85"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`Biriktirilgan rasm ${i + 1}`} className="h-24 w-auto max-w-40 object-cover" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl p-2">
                        <DialogTitle className="sr-only">Biriktirilgan rasm</DialogTitle>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`Biriktirilgan rasm ${i + 1}`} className="max-h-[80vh] w-full rounded-md object-contain" />
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              )}

              {/* Ovoz + Reaksiya chiplari + Javob + Muhokama — bir qatorda (OP) */}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
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
                  Javob
                </button>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="group inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <MessageSquare className="size-3.5" />
                    {replyCount > 0 ? `Muhokama · ${replyCount}` : "Izohlar"}
                    <ChevronDown className="size-3.5 transition-transform duration-fast ease-standard group-data-[state=open]:rotate-180" />
                  </button>
                </CollapsibleTrigger>
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
                          userAvatarUrl={userAvatarUrl}
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
                                {expanded ? "Javoblarni yashirish" : `${kids.length} ta javobni koʻrsatish`}
                              </button>
                            )}
                            {expanded &&
                              kids.map((r) => (
                                <ReplyRow
                                  key={r.id}
                                  reply={r}
                                  flashId={flashId}
                                  userAvatarUrl={userAvatarUrl}
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
          <CornerUpLeft className="size-4" /> Javob berish
        </ContextMenuItem>
        <ContextMenuItem onSelect={startEdit}>
          <Pencil className="size-4" /> Tahrirlash
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onSelect={() => setDeleteConfirmOpen(true)}>
          <Trash2 className="size-4" /> Oʻchirish
        </ContextMenuItem>
      </ContextMenuContent>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fikrni oʻchirasizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu amal qaytarib boʻlmaydi — fikr va unga yozilgan barcha javoblar butunlay
              oʻchiriladi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Oʻchirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ContextMenu>
  );
}
