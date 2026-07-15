"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Collapsible, CollapsibleTrigger, CollapsibleContent,
} from "@/components/ui/collapsible";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare, ChevronDown, ShieldCheck, Star, Send,
} from "lucide-react";
import { initialsOf, upvoteCount, type FeedbackStatus } from "@/store/useFeedbackStore";
import {
  CATEGORY_META, STATUS_META, STATUS_ORDER, formatFeedbackAgo, formatFeedbackFull,
} from "@/app/dashboard/(with-sidebar)/feedback/_components/feedback-meta";
import type { AdminFeedbackItem } from "@/server/dal/admin/feedback";
import { replyToFeedbackAction, setFeedbackStatusAction } from "@/server/actions/admin/feedback";

/* Admin fikr kartasi — oʻqituvchi tomonidagi FeedbackCard bilan bir xil
   vizual til (avatar/badge/reaksiya koʻrinishi), lekin admin ehtiyojiga
   moslashtirilgan: tahrirlash/oʻchirish yoʻq, holat — Select bilan
   almashtiriladi, javob HAR DOIM "Ustozona jamoasi" nomidan (server shunday
   ishlaydi), reaksiyalar oʻqish-uchun (admin ovoz/emoji bermaydi). */

const badgeBase =
  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap";
const CONTENT_INDENT = "pl-[52px]";

export default function AdminFeedbackCard({ row }: { row: AdminFeedbackItem }) {
  const router = useRouter();
  const item = row.item;
  const cat = CATEGORY_META[item.category];
  const CatIcon = cat.icon;
  const replyCount = item.replies.length;

  const [open, setOpen] = useState(replyCount > 0);
  const [reply, setReply] = useState("");
  const [pending, setPending] = useState(false);
  const [statusPending, setStatusPending] = useState(false);

  async function submitReply() {
    const body = reply.trim();
    if (!body) return;
    setPending(true);
    try {
      await replyToFeedbackAction({ feedbackId: row.id, body });
      toast.success("Javob yuborildi");
      setReply("");
      setOpen(true);
      router.refresh();
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setPending(false);
    }
  }

  async function changeStatus(status: FeedbackStatus) {
    setStatusPending(true);
    try {
      await setFeedbackStatusAction({ feedbackId: row.id, status });
      toast.success("Holat yangilandi");
      router.refresh();
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setStatusPending(false);
    }
  }

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm md:p-5">
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* ── Sarlavha: avatar + oʻqituvchi/sana | turkum + holat (Select) ──
            Avatar/ism — /admin/users'dagi hisobga havola (real profil). */}
        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href={`/admin/users?q=${encodeURIComponent(row.teacherEmail)}`} className="shrink-0">
                <Avatar size="lg" className="transition-opacity hover:opacity-80">
                  {row.teacherAvatarUrl && <AvatarImage src={row.teacherAvatarUrl} alt={row.teacherName} />}
                  <AvatarFallback className="bg-muted text-sm font-semibold text-muted-foreground">
                    {item.authorInitials}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Foydalanuvchi maʼlumotlarini koʻrish</TooltipContent>
          </Tooltip>

          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <Link
                href={`/admin/users?q=${encodeURIComponent(row.teacherEmail)}`}
                className="w-fit truncate text-sm font-semibold text-foreground hover:text-primary hover:underline"
              >
                {row.teacherName}
              </Link>
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-xs text-muted-foreground/70">{row.teacherEmail}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="shrink-0 cursor-default text-xs text-muted-foreground/70">
                      · {formatFeedbackAgo(item.createdAt)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>{formatFeedbackFull(item.createdAt)}</TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <span className={cn(badgeBase, cat.pill)}>
                <CatIcon className="size-3 shrink-0" />
                {cat.label}
              </span>
              <Select
                value={item.status}
                onValueChange={(v) => changeStatus(v as FeedbackStatus)}
              >
                <SelectTrigger
                  className={cn("h-7 w-auto gap-1 border px-2 text-xs font-semibold shadow-none", STATUS_META[item.status].pill)}
                  size="sm"
                  disabled={statusPending}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {STATUS_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_META[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* ── Tana + reaksiya (o'qish-uchun) + suhbat ── */}
        <div className={cn("mt-2", CONTENT_INDENT)}>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {item.body}
          </p>

          {item.images && item.images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {item.images.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={`Biriktirilgan rasm ${i + 1}`}
                  className="h-20 w-auto max-w-32 rounded-lg border border-border object-cover"
                />
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            {upvoteCount(item) > 0 && (
              <span className="inline-flex h-7 items-center gap-1 rounded-full border border-border bg-background px-2 text-xs font-semibold tabular-nums text-muted-foreground">
                ↑ {upvoteCount(item)}
              </span>
            )}
            {item.reactions
              .filter((r) => r.emoji !== "👍")
              .map((r) => (
                <span
                  key={r.emoji}
                  className="inline-flex h-7 items-center gap-1 rounded-full border border-border bg-background px-2 text-xs font-semibold tabular-nums text-muted-foreground"
                >
                  {r.emoji} {r.count}
                </span>
              ))}
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="group inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <MessageSquare className="size-3.5" />
                {replyCount > 0 ? `Muhokama · ${replyCount}` : "Javob berish"}
                <ChevronDown className="size-3.5 transition-transform duration-fast ease-standard group-data-[state=open]:rotate-180" />
              </button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1">
            <div className="mt-3.5 space-y-3 border-t border-border/60 pt-4">
              {item.replies.map((r) => (
                <div key={r.id} className="flex items-start gap-3">
                  <Avatar size="default" className="mt-0.5 shrink-0">
                    <AvatarFallback
                      className={cn(
                        "text-xs font-semibold",
                        r.isOfficial ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {r.isOfficial ? <ShieldCheck className="size-4" /> : initialsOf(r.author)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-semibold text-foreground">{r.author}</span>
                      {r.isOfficial && (
                        <>
                          <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" />
                          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                            Rasmiy
                          </span>
                        </>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default text-xs text-muted-foreground/70">
                            · {formatFeedbackAgo(r.createdAt)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>{formatFeedbackFull(r.createdAt)}</TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                      {r.body}
                    </p>
                  </div>
                </div>
              ))}

              {/* Javob kompozeri — har doim "Ustozona jamoasi" nomidan */}
              <div className="flex items-start gap-3">
                <Avatar size="default" className="mt-0.5 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <ShieldCheck className="size-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="rounded-xl border border-border bg-background px-3 py-2 transition-colors focus-within:border-primary/50">
                    <Textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitReply();
                      }}
                      placeholder="Ustozona jamoasi nomidan javob yozing…"
                      rows={2}
                      disabled={pending}
                      className="min-h-0 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                    />
                    <div className="mt-1.5 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                        <ShieldCheck className="size-3.5" />
                        Ustozona jamoasi nomidan
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 gap-1.5 px-3 text-xs"
                        disabled={pending || !reply.trim()}
                        onClick={submitReply}
                      >
                        <Send className="size-3.5" />
                        Javob berish
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </article>
  );
}
