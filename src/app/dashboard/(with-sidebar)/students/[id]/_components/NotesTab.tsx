"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { EmojiText } from "@/components/ui/emoji-text";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeaderBar,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import {
  Plus,
  X,
  Search,
  Mic,
  FileText,
  StickyNote,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Visibility } from "@/store/useStudentNotesStore";

export type Note = {
  id: string;
  title: string | null;
  text: string;
  tags: string[];
  visibility: Visibility;
  time: string;
  createdAt: string;
  authorName?: string;
  authorAvatarUrl?: string | null;
  /** Hamkasb qaydi boʻlsa false — tahrir menyusi umuman chizilmaydi.
      ⚠️ `disabled` emas, YOʻQ: bosilmaydigan tugma «nega ishlamayapti?»
      degan savol tugʻdiradi, holbuki javob oddiy — bu qayd meniki emas. */
  canEdit: boolean;
};

type Mode = "short" | "full";

const TAG_META = {
  pill: "bg-primary/10 text-primary border-primary/20",
  dot: "bg-primary",
};

export default function NotesTab({
  notes,
  onAdd,
  onUpdate,
  onDelete,
  hex,
}: {
  notes: Note[];
  onAdd: (
    text: string,
    tags: string[],
    visibility: Visibility,
    title?: string | null
  ) => void;
  onUpdate: (id: string, text: string, tags: string[], title?: string | null) => void;
  onDelete: (id: string) => void;
  hex: string;
}) {
  const t = useTranslations("NotesTab");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("short");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<string | "all">("all");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const openComposer = (m: Mode) => {
    setEditingId(null);
    setMode(m);
    setDialogOpen(true);
  };

  const openEdit = (n: Note) => {
    setEditingId(n.id);
    setMode(n.title ? "full" : "short");
    setTitle(n.title ?? "");
    setText(n.text);
    setTags(n.tags);
    setDialogOpen(true);
  };

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]));
  };

  const addCustomTag = () => {
    const v = customTagInput.trim();
    if (!v || tags.includes(v)) return setCustomTagInput("");
    setTags((prev) => [...prev, v]);
    setCustomTagInput("");
  };

  const resetComposer = () => {
    setDialogOpen(false);
    setMode("short");
    setTitle("");
    setText("");
    setTags([]);
    setCustomTagInput("");
    setEditingId(null);
  };

  const submit = () => {
    const v = text.trim();
    if (!v) return;
    if (editingId) {
      onUpdate(editingId, v, tags, mode === "full" ? title : null);
    } else {
      onAdd(v, tags, "teachers", mode === "full" ? title : null);
    }
    resetComposer();
  };

  const confirmDelete = () => {
    if (deleteTargetId) onDelete(deleteTargetId);
    setDeleteTargetId(null);
  };

  const allTags = useMemo(() => {
    const s = new Set<string>();
    for (const n of notes) for (const tg of n.tags) s.add(tg);
    return Array.from(s);
  }, [notes]);

  const visible = useMemo(() => {
    let list = notes;
    if (tagFilter !== "all") list = list.filter((n) => n.tags.includes(tagFilter));
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((n) => n.text.toLowerCase().includes(q) || (n.title ?? "").toLowerCase().includes(q));
    list = [...list].sort((a, b) =>
      sort === "newest"
        ? b.createdAt.localeCompare(a.createdAt)
        : a.createdAt.localeCompare(b.createdAt)
    );
    return list;
  }, [notes, tagFilter, query, sort]);

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
      {/* Header — qotib turadi, faqat pastdagi roʻyxat scroll boʻladi */}
      {notes.length > 0 && (
      <div className="shrink-0 space-y-3 border-b border-border p-4">
        {notes.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-40 flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="h-8 pl-8 text-xs"
              />
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as "newest" | "oldest")}>
              <SelectTrigger size="sm" className="h-8 w-auto text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="newest">{t("sortNewest")}</SelectItem>
                <SelectItem value="oldest">{t("sortOldest")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {allTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterPill active={tagFilter === "all"} onClick={() => setTagFilter("all")}>
              {t("all", { count: notes.length })}
            </FilterPill>
            {allTags.map((tag) => (
              <FilterPill key={tag} active={tagFilter === tag} onClick={() => setTagFilter(tag)}>
                {tag}
              </FilterPill>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Roʻyxat — kartaning oʻzida scroll boʻladi */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex h-full min-h-full flex-col p-4">
          {visible.length === 0 ? (
            <Empty className="flex-1 border-0">
              <EmptyHeader>
                <EmptyMedia><Illustration name="46" className="h-32 text-black dark:text-white" /></EmptyMedia>
                <EmptyTitle>{notes.length === 0 ? t("emptyNoNotes") : t("emptyFiltered")}</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((n) => (
            <div
              key={n.id}
              className="flex flex-col rounded-xl border border-border bg-muted/30 p-4"
            >
              {n.title && <p className="mb-1 text-sm font-semibold text-foreground">{n.title}</p>}
              <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm text-foreground"><EmojiText text={n.text} /></p>
              {n.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {n.tags.map((tag) => (
                    <span
                      key={tag}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
                        TAG_META.pill
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", TAG_META.dot)} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 flex items-center gap-1.5 border-t border-border/60 pt-2.5">
                <Avatar size="sm">
                  <AvatarImage src={n.authorAvatarUrl ?? undefined} alt={n.authorName ?? ""} />
                  <AvatarFallback>{(n.authorName ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                  {n.authorName ?? t("unknownAuthor")} · {n.time}
                </span>
                {n.canEdit ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0 text-muted-foreground"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => openEdit(n)}>
                      <Pencil className="size-4" /> {t("edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setDeleteTargetId(n.id)}
                    >
                      <Trash2 className="size-4" /> {t("delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                ) : null}
              </div>
            </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Floating add button */}
      <div className="pointer-events-none absolute bottom-4 right-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="icon"
              style={{ backgroundColor: hex }}
              className="pointer-events-auto size-12 rounded-full text-white shadow-[0_3px_5px_-1px_rgba(0,0,0,0.2),0_6px_10px_0_rgba(0,0,0,0.14),0_1px_18px_0_rgba(0,0,0,0.12)] transition-shadow hover:brightness-110 hover:shadow-[0_5px_5px_-3px_rgba(0,0,0,0.2),0_8px_10px_1px_rgba(0,0,0,0.14),0_3px_14px_2px_rgba(0,0,0,0.12)]"
            >
              <Plus className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="pointer-events-auto w-56">
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setTimeout(() => openComposer("short"), 0);
              }}
            >
              <StickyNote className="size-4" /> {t("modeShort")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                setTimeout(() => openComposer("full"), 0);
              }}
            >
              <FileText className="size-4" /> {t("modeFull")}
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="justify-between">
              <span className="flex items-center gap-2">
                <Mic className="size-4" /> {t("modeAudio")}
              </span>
              <Badge variant="secondary" className="text-[10px]">{t("soon")}</Badge>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Composer dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => (o ? setDialogOpen(true) : resetComposer())}>
        <DialogContent showCloseButton={false} className="p-0" width="32rem">
          <DialogHeaderBar title={editingId ? t("editTitle") : mode === "full" ? t("modeFull") : t("modeShort")} />
          <div className="space-y-3 px-6 py-4">
            {mode === "full" && (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("titlePlaceholder")}
                className="h-9 border-0 bg-transparent px-0 text-base font-semibold shadow-none focus-visible:ring-0"
              />
            )}
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("placeholder")}
              className="min-h-24 resize-none"
              autoFocus
            />

            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                    TAG_META.pill
                  )}
                >
                  {tag}
                  <button type="button" onClick={() => toggleTag(tag)} aria-label={t("removeTagAria", { tag })}>
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <Input
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addCustomTag();
                  }
                }}
                onBlur={addCustomTag}
                placeholder={t("addTagPlaceholder")}
                className="h-7 w-32 border-0 bg-transparent px-1.5 text-xs shadow-none focus-visible:ring-0"
              />
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <span className="relative inline-flex w-fit shrink-0">
                  <Button type="button" variant="outline" size="icon" disabled className="size-7 opacity-60">
                    <Mic className="size-3.5" />
                  </Button>
                  <Badge
                    variant="secondary"
                    className="absolute -right-2 -top-2 px-1 py-0 text-[9px] leading-4"
                  >
                    {t("soon")}
                  </Badge>
                </span>
              </TooltipTrigger>
              <TooltipContent>{t("audioSoonTooltip")}</TooltipContent>
            </Tooltip>
          </div>
          <DialogFooter className="px-6 pb-6">
            <Button variant="outline" onClick={resetComposer}>{t("cancel")}</Button>
            <Button onClick={submit} disabled={!text.trim()} className="font-semibold">
              {editingId ? t("save") : (<><Plus className="size-4" /> {t("add")}</>)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(o) => !o && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}
