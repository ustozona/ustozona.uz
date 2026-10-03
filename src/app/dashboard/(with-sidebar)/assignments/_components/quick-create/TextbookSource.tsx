"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { BookOpen, Camera, ClipboardPaste, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SOURCE_MAX, type AiMaterialError } from "@/lib/ai-materials";

/* ════════════════════════════════════════════════════════════════════
   DARSLIKDAN — AI materiali davlat darsligiga tayansin.

   Faqat mavzu nomi berilsa AI darslikdagi aniq matndan chetga chiqishi
   mumkin. Bu yerda oʻqituvchi darslik matnini joylaydi yoki sahifani
   telefonda suratga oladi (`/api/ustozona-ai/read-page` — AI matnni
   aynan koʻchiradi); test, taqdimot va boshqa material FAQAT shu matndan
   tuziladi (`AiMaterialRequest.source`).

   Surat oʻqish — sahifa boshiga 1 AI krediti (koʻpi bilan 3 sahifa).
   Matn maydoni oddiy matn: oʻqituvchi koʻradi va keraksizini oʻchiradi.
   ════════════════════════════════════════════════════════════════════ */

const MAX_PAGES = 3;

/** Suratni matn oʻqilishi uchun yetarli, lekin 4 MB dan kichik qiladi. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ?? file;
  } catch {
    return file;
  }
}

export function TextbookSource({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (text: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("QuickCreate");
  const photoRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [reading, setReading] = useState(0);

  async function readPages(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, MAX_PAGES);
    if (files.length > MAX_PAGES) toast.info(t("source.maxPages", { count: MAX_PAGES }));
    setOpen(true);
    let text = value;
    let remaining: number | undefined;
    for (let i = 0; i < list.length; i++) {
      setReading(i + 1);
      try {
        const form = new FormData();
        form.set("image", await shrink(list[i]), "sahifa.jpg");
        const res = await fetch("/api/ustozona-ai/read-page", { method: "POST", body: form });
        const body = (await res.json().catch(() => null)) as { text?: string; remaining?: number; error?: AiMaterialError } | null;
        if (!res.ok || !body?.text) {
          const code = body?.error ?? "failed";
          // Surat yoʻli uchun aniqroq matn: «mavzuni tekshiring» bu yerda chalgʻitadi.
          toast.error(
            code === "unreadable" ? t("source.unreadable") : code === "bad_request" ? t("source.badPhoto") : t(`errors.${code}`),
          );
          continue;
        }
        remaining = body.remaining;
        text = (text.trim() ? `${text.trim()}\n\n${body.text}` : body.text).slice(0, SOURCE_MAX);
        onChange(text);
      } catch {
        toast.error(t("errors.network"));
        break;
      }
    }
    setReading(0);
    if (photoRef.current) photoRef.current.value = "";
    if (typeof remaining === "number") toast.success(t("source.read"), { description: t("readyHint", { count: remaining }) });
  }

  const shown = open || value.length > 0;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          <BookOpen className="size-4 text-muted-foreground" />
          {t("source.title")}
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 shadow-none"
            disabled={disabled || reading > 0}
            onClick={() => photoRef.current?.click()}
          >
            {reading > 0 ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
            {reading > 0 ? t("source.reading", { page: reading }) : t("source.photo")}
          </Button>
          {!shown && (
            <Button size="sm" variant="ghost" className="gap-1.5" disabled={disabled} onClick={() => setOpen(true)}>
              <ClipboardPaste className="size-3.5" />
              {t("source.paste")}
            </Button>
          )}
        </div>
      </div>
      <p className="text-caption text-muted-foreground">{t("source.hint")}</p>
      {shown && (
        <div className="flex flex-col gap-1">
          <Textarea
            autoFocus={open && !value}
            value={value}
            onChange={(e) => onChange(e.target.value.slice(0, SOURCE_MAX))}
            placeholder={t("source.placeholder")}
            maxLength={SOURCE_MAX}
            disabled={disabled}
            className="min-h-28 rounded-xl bg-muted/40 px-4 py-2 text-sm shadow-none"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-caption tabular-nums text-muted-foreground">
              {value.length} / {SOURCE_MAX}
            </span>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="inline-flex items-center gap-1 text-caption font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" />
              {t("source.clear")}
            </button>
          </div>
        </div>
      )}
      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => void readPages(e.target.files)}
      />
    </div>
  );
}
