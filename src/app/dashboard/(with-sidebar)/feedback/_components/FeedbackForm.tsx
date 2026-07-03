"use client";

import { useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Kbd } from "@/components/ui/kbd";
import { ImagePlus, Send } from "lucide-react";
import {
  useFeedbackStore, initialsOf, type FeedbackCategory,
} from "@/store/useFeedbackStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { CATEGORY_META, CATEGORY_ORDER } from "./feedback-meta";
import { useImageAttachments, AttachmentPreviewList } from "./attachments";
import type { NewFeedbackFormValue } from "./types";

/* Fikr yuborish formasining YAGONA tanasi — sahifadagi inline kompozer va
   header'dagi QuickFeedback popover shu formani oʻraydi (avval ikkalasi
   deyarli nusxa edi va detallari ajralib keta boshlagan edi). */

/** Turkumga qarab oʻzgaruvchi placeholder. */
const BODY_PLACEHOLDER: Record<FeedbackCategory, string> = {
  taklif: "Qanday imkoniyat qoʻshilishini xohlaysiz? Batafsil yozing…",
  xato: "Nima ishlamayapti? Qanday yuz berdi?",
  savol: "Savolingizni yozing…",
  maqtov: "Nima yoqdi? Bizga ilhom bering!",
  boshqa: "Fikringizni yozing…",
};

/** addFeedback + muvaffaqiyat toasti — ikkala kirish nuqtasi uchun umumiy. */
export function useFeedbackSubmit() {
  const router = useRouter();
  const addFeedback = useFeedbackStore((s) => s.addFeedback);
  const profile = useSettingsStore((s) => s.profile);
  const settingsHydrated = useSettingsStore((s) => s._hasHydrated);

  return (value: NewFeedbackFormValue): string => {
    const userName = settingsHydrated ? profile.name : "Siz";
    const id = addFeedback({
      ...value,
      author: userName,
      authorInitials: initialsOf(userName),
    });
    toast.success("Fikringiz yuborildi. Rahmat! 🎉", {
      description: "Doskaga qoʻshildi — boshqa ustozlar ham ovoz bera oladi.",
      action: {
        label: "Koʻrish",
        onClick: () => router.push(`/dashboard/feedback?item=${id}`),
      },
    });
    return id;
  };
}

type Props = {
  autoFocus?: boolean;
  rows?: number;
  submitLabel?: string;
  /** Textarea qatorining boshiga qoʻyiladigan element (mas. avatar). */
  leading?: ReactNode;
  /** Toolbar'da rasm va yuborish orasiga qoʻshiladigan amallar (mas. X). */
  extraActions?: ReactNode;
  /** Esc bosilganda (inline kompozer yigʻiladi; popover'ni Radix oʻzi yopadi). */
  onEscape?: () => void;
  /** Yuborilgach chaqiriladi (forma oʻzi tozalanadi va fokusni qaytaradi). */
  onSubmitted?: (id: string) => void;
};

export default function FeedbackForm({
  autoFocus, rows = 3, submitLabel = "Yuborish", leading, extraActions, onEscape, onSubmitted,
}: Props) {
  const [category, setCategory] = useState<FeedbackCategory>("taklif");
  const [body, setBody] = useState("");
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const attachments = useImageAttachments();
  const submitFeedback = useFeedbackSubmit();

  const canSubmit = body.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    const id = submitFeedback({ body: body.trim(), category, images: attachments.images });
    // Maydonlar tozalanadi, fokus qoladi (ketma-ket fikr uchun qulay).
    setBody("");
    setCategory("taklif");
    attachments.reset();
    requestAnimationFrame(() => bodyRef.current?.focus());
    onSubmitted?.(id);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="flex gap-3">
        {leading}
        <div className="min-w-0 flex-1">
          <Textarea
            ref={bodyRef}
            autoFocus={autoFocus}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") onEscape?.();
            }}
            onPaste={attachments.onPaste}
            placeholder={BODY_PLACEHOLDER[category]}
            rows={rows}
            className="resize-none border-none bg-transparent p-0 text-sm shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
          />
        </div>
      </div>

      {/* Turkum pillalari */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {CATEGORY_ORDER.map((key) => {
          const meta = CATEGORY_META[key];
          const Icon = meta.icon;
          const active = category === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                active ? meta.pill : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Savol uchun yumshoq yoʻnaltirish */}
      {category === "savol" && (
        <p className="mt-2 text-xs text-muted-foreground/70">
          Tezkor javob kerak boʻlsa,{" "}
          <Link href="/dashboard/help" className="font-medium text-primary hover:underline">
            Yordam sahifasi
          </Link>{" "}
          qulayroq boʻlishi mumkin.
        </p>
      )}

      {/* Biriktirilgan rasmlar */}
      {attachments.images.length > 0 && (
        <div className="mt-3">
          <AttachmentPreviewList images={attachments.images} onRemove={attachments.removeAt} />
        </div>
      )}

      {/* Toolbar: screenshot ishorasi + amallar */}
      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        <span className="hidden items-center gap-1.5 text-xs text-muted-foreground/70 sm:inline-flex">
          Skrinshot: <Kbd>Win</Kbd> <Kbd>Shift</Kbd> <Kbd>S</Kbd> soʻng <Kbd>Ctrl</Kbd> <Kbd>V</Kbd>
        </span>

        <div className="ml-auto flex items-center gap-1.5">
          <input
            ref={attachments.fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={attachments.onInputChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Rasm biriktirish"
            onClick={attachments.openPicker}
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <ImagePlus className="size-4" />
          </Button>
          {extraActions}
          <Button type="submit" size="sm" className="h-8 gap-1.5 px-3 text-xs" disabled={!canSubmit}>
            <Send className="size-3.5" />
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
