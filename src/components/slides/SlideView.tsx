"use client";

import * as React from "react";
import { ImagePlus, Loader2, Quote, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { parseVideoUrl } from "@/lib/video-embed";
import { VideoEmbedFacade } from "@/components/video-embed/VideoEmbedFacade";
import {
  SLIDE_LAYOUT_META,
  slideBullets,
  type SlideLayout,
} from "@/lib/slide-layouts";

/* ════════════════════════════════════════════════════════════════════
   SLAYD — YAGONA RENDERER (docs/taqdimot-spec.md, 3-qaror).

   Muharrir (tahrirlanadigan), oʻquvchi ekrani (/play) va Doska vidjeti
   shu komponentni chizadi — aks holda uch joyda uch xil slayd chiqardi.

   Komponent sahnaning ICHINI chizadi: ota-element `.quiz-stage` boʻlishi
   kerak (16:9, `container-type: inline-size`, `--stage-bg` va urgʻu
   `--stage-accent` — `stageThemeVars()`). Oʻlchamlar
   `cqw` da, shuning uchun sahna qaysi oʻlchamda boʻlmasin nisbat bir xil.

   `edit` berilsa — matnlar joyida tahrirlanadi (WYSIWYG), rasm oʻrni
   yuklash tugmasiga aylanadi. Berilmasa — faqat oʻqish.
   ════════════════════════════════════════════════════════════════════ */

export type SlideContent = {
  layout: SlideLayout;
  title: string;
  body: string;
  imageUrl?: string;
  videoUrl?: string;
};

export type SlideEditHandlers = {
  onTitle: (value: string) => void;
  onBody: (value: string) => void;
  onPickImage: (file: File) => void;
  onRemoveImage: () => void;
  uploading?: boolean;
};

export function SlideView({ slide, edit }: { slide: SlideContent; edit?: SlideEditHandlers }) {
  const meta = SLIDE_LAYOUT_META[slide.layout];
  const title = (className: string, as: "h2" | "p" = "h2") => (
    <SlideText
      as={as}
      value={slide.title}
      placeholder={meta.titlePlaceholder}
      onChange={edit?.onTitle}
      className={className}
    />
  );
  const body = (className: string) => (
    <SlideText
      as="p"
      multiline
      value={slide.body}
      placeholder={meta.bodyPlaceholder}
      onChange={edit?.onBody}
      className={className}
    />
  );
  const image = (className?: string) => (
    <SlideImage slide={slide} edit={edit} className={className} />
  );

  switch (slide.layout) {
    case "title":
      return (
        <div className="slide-panel items-center justify-center text-center">
          {title("slide-h-xl text-center")}
          {(edit || slide.body) && body("slide-text-lg text-center text-muted-foreground")}
        </div>
      );

    case "list": {
      const hasImage = Boolean(slide.imageUrl) || Boolean(edit);
      return (
        <div
          className={cn("slide-panel grid", hasImage && "grid-cols-[3fr_2fr]")}
          style={{ display: "grid" }}
        >
          <div className="flex min-h-0 min-w-0 flex-col gap-[2cqw]">
            {title("slide-h")}
            <span aria-hidden className="slide-accent-bar" />
            {edit ? (
              body("slide-text")
            ) : (
              <ul className="slide-text flex flex-col gap-[1.2cqw]">
                {slideBullets(slide.body).map((item, i) => (
                  <li key={i} className="flex gap-[1.5cqw]">
                    <span
                      aria-hidden
                      className="mt-[0.55em] size-[0.45em] shrink-0 rounded-full"
                      style={{ background: "var(--stage-accent)" }}
                    />
                    <span className="min-w-0">{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {hasImage && image("h-full")}
        </div>
      );
    }

    case "classic":
      return (
        <div className="slide-panel items-center text-center">
          {title("slide-h text-center")}
          {(slide.imageUrl || edit) && image("min-h-0 w-full flex-1")}
          {(edit || slide.body) && body("slide-text text-center")}
        </div>
      );

    case "media": {
      const video = slide.videoUrl ? parseVideoUrl(slide.videoUrl) : null;
      return (
        <div className="slide-panel items-center p-[2cqw]">
          {video ? (
            <div className="flex min-h-0 w-full flex-1 items-center justify-center">
              <div className="aspect-video h-full max-w-full">
                <VideoEmbedFacade video={video} interactive={!edit} className="size-full" />
              </div>
            </div>
          ) : (
            image("min-h-0 w-full flex-1")
          )}
          {(edit || slide.title) && title("slide-caption text-center text-muted-foreground", "p")}
        </div>
      );
    }

    case "quote":
      return (
        <div className="slide-panel items-center justify-center gap-[3cqw] text-center">
          <Quote aria-hidden className="size-[7cqw]" style={{ color: "var(--stage-accent)" }} />
          {body("slide-text-lg text-center italic")}
          {(edit || slide.title) && (
            <div className="slide-caption flex items-center gap-[1cqw] text-muted-foreground">
              <span aria-hidden>—</span>
              {title("slide-caption text-muted-foreground", "p")}
            </div>
          )}
        </div>
      );

    case "text":
    default:
      return (
        <div className="slide-panel">
          {title("slide-h")}
          <span aria-hidden className="slide-accent-bar" />
          {body("slide-text whitespace-pre-wrap")}
        </div>
      );
  }
}

/** Oʻqishda — oddiy matn; tahrirda — oʻsha koʻrinishdagi textarea. */
function SlideText({
  as,
  value,
  placeholder,
  onChange,
  multiline = false,
  className,
}: {
  as: "h2" | "p";
  value: string;
  placeholder: string;
  onChange?: (value: string) => void;
  multiline?: boolean;
  className?: string;
}) {
  if (onChange) {
    return (
      <textarea
        value={value}
        onChange={(e) =>
          // Sarlavha bitta qatorda: Enter yangi qator emas.
          onChange(multiline ? e.target.value : e.target.value.replace(/\r?\n/g, " "))
        }
        placeholder={placeholder}
        rows={1}
        maxLength={multiline ? 2000 : 200}
        className={cn("slide-edit", className)}
      />
    );
  }
  if (!value) return null;
  const Tag = as;
  return <Tag className={cn("min-w-0 whitespace-pre-wrap break-words", className)}>{value}</Tag>;
}

function SlideImage({
  slide,
  edit,
  className,
}: {
  slide: SlideContent;
  edit?: SlideEditHandlers;
  className?: string;
}) {
  const fileRef = React.useRef<HTMLInputElement>(null);

  if (slide.imageUrl) {
    return (
      <div className={cn("relative flex min-h-0 items-center justify-center", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- foydalanuvchi rasmi, oʻlchami nomaʼlum */}
        <img
          src={slide.imageUrl}
          alt=""
          className="max-h-full max-w-full rounded-[1cqw] object-contain"
        />
        {edit && (
          <button
            type="button"
            onClick={edit.onRemoveImage}
            aria-label="Rasmni olib tashlash"
            className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    );
  }

  if (!edit) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={edit.uploading}
        className={cn(
          "slide-caption flex min-h-[8cqw] flex-col items-center justify-center gap-[1cqw] rounded-[1cqw] border-2 border-dashed border-border text-muted-foreground transition-colors hover:bg-muted/50",
          className,
        )}
      >
        {edit.uploading ? (
          <Loader2 className="size-[4cqw] animate-spin" />
        ) : (
          <ImagePlus className="size-[4cqw]" />
        )}
        Rasm qoʻshish
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) edit.onPickImage(file);
        }}
      />
    </>
  );
}
