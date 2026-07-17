"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentGroup,
} from "@/components/ui/attachment";

/* Fikrga rasm biriktirish — paste (Ctrl+V) va fayl tanlash orqali.
   localStorage kvotasini himoya qilish uchun rasmlar canvas'da
   kichraytirilib JPEG data URL sifatida saqlanadi. */

export const MAX_FEEDBACK_IMAGES = 4;

/** Rasmni maks. oʻlchamga kichraytirib JPEG data URL qaytaradi. */
async function downscaleToDataUrl(file: File, maxDim = 1000, quality = 0.72): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", quality);
}

export function useImageAttachments(max = MAX_FEEDBACK_IMAGES) {
  const t = useTranslations("FeedbackAttachments");
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = async (files: Iterable<File>) => {
    const imgFiles = [...files].filter((f) => f.type.startsWith("image/"));
    if (imgFiles.length === 0) return;
    const room = max - images.length;
    if (room <= 0) {
      toast.error(t("toastMax", { max }));
      return;
    }
    if (imgFiles.length > room) {
      toast.error(t("toastPartial", { room, max }));
    }
    try {
      const urls = await Promise.all(imgFiles.slice(0, room).map((f) => downscaleToDataUrl(f)));
      setImages((prev) => [...prev, ...urls].slice(0, max));
    } catch {
      toast.error(t("toastReadError"));
    }
  };

  /** Textarea'ga skrinshot Ctrl+V qilinganda. */
  const onPaste = (e: React.ClipboardEvent) => {
    const files = [...(e.clipboardData?.files ?? [])].filter((f) => f.type.startsWith("image/"));
    if (files.length > 0) {
      e.preventDefault();
      void addFiles(files);
    }
  };

  const openPicker = () => fileInputRef.current?.click();

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) void addFiles(e.target.files);
    e.target.value = "";
  };

  const removeAt = (i: number) => setImages((prev) => prev.filter((_, idx) => idx !== i));
  const reset = () => setImages([]);

  return { images, fileInputRef, onPaste, openPicker, onInputChange, removeAt, reset };
}

/** Kompozer ichidagi biriktirilgan rasmlar qatori. */
export function AttachmentPreviewList({
  images,
  onRemove,
}: {
  images: string[];
  onRemove: (index: number) => void;
}) {
  const t = useTranslations("FeedbackAttachments");
  if (images.length === 0) return null;
  return (
    <AttachmentGroup>
      {images.map((src, i) => (
        <Attachment key={i} size="sm">
          <AttachmentMedia variant="image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={t("imageAlt", { index: i + 1 })} />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{t("imageTitle", { index: i + 1 })}</AttachmentTitle>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label={t("removeAria", { index: i + 1 })} onClick={() => onRemove(i)}>
              <X />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      ))}
    </AttachmentGroup>
  );
}
