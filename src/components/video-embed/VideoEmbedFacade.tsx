"use client";

import { useEffect, useState } from "react";
import { Maximize2, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PROVIDER_LABEL,
  embedAspectRatio,
  embedSrc,
  thumbnailFallbackUrl,
  thumbnailUrl,
  type VideoEmbedRef,
} from "@/lib/video-embed";

/**
 * Video fasadi — muharrir ham, nashr qilingan sahifa ham SHU komponentni
 * ishlatadi (ikki xil koʻrinish qurilsa ular albatta bir-biridan uzoqlashib
 * ketardi: muharrirda bir xil, nashrda boshqacha video — eng bezovta
 * qiladigan xato turi).
 *
 * Uch holat:
 *   1. tinch     — rasm (YouTube) yoki brend kartasi (Instagram) + ▶︎
 *   2. ijro      — iframe qoʻyilgan (`autoplay`), fasad olib tashlangan
 *   3. kengaygan — YouTube uchun modal (Instagram posti tik, foyda yoʻq)
 *
 * Iframe FAQAT 2/3-holatda DOM'ga tushadi — fasadning butun maʼnosi shu.
 *
 * ⚠️ Prop nomi `video`, `ref` EMAS: React'da `ref` maxsus nom, komponentga
 *    prop sifatida yetib bormaydi.
 */
export function VideoEmbedFacade({
  video,
  className,
  /** Muharrir ichida `false`: bosish tugunni tanlashi kerak, ijro emas. */
  interactive = true,
}: {
  video: VideoEmbedRef;
  className?: string;
  interactive?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [thumbBroken, setThumbBroken] = useState(false);

  const aspect = embedAspectRatio(video);
  const maxres = thumbnailUrl(video);
  const thumb = maxres && thumbBroken ? thumbnailFallbackUrl(video.videoId) : maxres;
  const canExpand = video.provider === "youtube";

  /** Kengaygan koʻrinishni yopish. `playing` ni ham tushirish SHART:
   *  aks holda ichki iframe darhol qayta mount boʻlib, `autoplay=1` bilan
   *  videoni 0:00 dan boshlab maqola oʻrtasida ovoz bilan ijro etardi. */
  const closeExpanded = () => {
    setExpanded(false);
    setPlaying(false);
  };

  /* Modal ochiqda Escape — brauzerdagi har qanday qatlam uchun kutiladigan
     xatti-harakat. */
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      /* `closeExpanded` emas, ikkala setter: funksiya har renderda
         qaytadan yaratiladi va effekt bogʻliqliklariga tushib qolardi. */
      if (e.key === "Escape") {
        setExpanded(false);
        setPlaying(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [expanded]);

  return (
    <>
      <div
        className={cn(
          "video-embed-frame group relative w-full overflow-hidden rounded-xl bg-muted",
          /* Instagram posti tik: butun matn kengligini egallashi shart emas,
             markazda tor ustun tabiiyroq koʻrinadi. */
          video.provider === "instagram" && "mx-auto max-w-sm",
          className,
        )}
        style={{ aspectRatio: aspect }}
      >
        {playing && !expanded ? (
          <iframe
            src={embedSrc(video)}
            title={`${PROVIDER_LABEL[video.provider]} video`}
            className="absolute inset-0 size-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <>
            {thumb ? (
              /* `video-embed-thumb` SINFI SHART: prose ichidagi umumiy
                 rasm qoidasi (`.lesson-prose img:not(.apple-emoji-img)`)
                 oʻzilligi bilan `size-full` dan kuchli va rasmga
                 `height: auto` + vertikal margin beradi — busiz thumbnail
                 quti balandligini toʻldirmay, tepa/pastda kulrang chiziq
                 qoldiradi. Qoida globals.css da bekor qilinadi. */
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={thumb}
                alt=""
                loading="lazy"
                className="video-embed-thumb absolute inset-0 size-full object-cover"
                onError={() => setThumbBroken(true)}
              />
            ) : (
              /* Rasmsiz manba (Instagram thumbnail'ni access token'siz
                 bermaydi) — neytral gradient. Ataylab jimjimador emas: bu
                 joyda video BOR degan belgi yetarli. */
              <div className="absolute inset-0 bg-gradient-to-br from-muted to-accent" />
            )}

            {/* Yengil qorayish — ▶︎ har qanday kadrda oʻqiladi (oq qorli
                thumbnail ham uchraydi). */}
            <div className="absolute inset-0 bg-foreground/15" />

            {/* ⚠️ `disabled` EMAS, `pointer-events-none`. Disabled
                kontrolga brauzer sichqoncha hodisasini umuman yubormaydi —
                muharrirda blok ustiga bosilganda ProseMirror mousedown'ni
                koʻrmay qolar va tugun TANLANMAS edi (Backspace bilan
                oʻchirish ishlamaydi). `pointer-events-none` da esa bosish
                NodeView oʻramiga oʻtadi va tanlov ishlaydi. */}
            <button
              type="button"
              aria-label="Videoni ijro etish"
              tabIndex={interactive ? undefined : -1}
              aria-hidden={interactive ? undefined : true}
              onClick={() => setPlaying(true)}
              className={cn(
                "absolute inset-0 flex items-center justify-center outline-none",
                !interactive && "pointer-events-none",
              )}
            >
              <span
                className={cn(
                  "flex size-16 items-center justify-center rounded-full bg-background/85 shadow-lg backdrop-blur transition",
                  interactive && "group-hover:scale-105",
                )}
              >
                <Play className="ml-0.5 size-7 fill-foreground text-foreground" />
              </span>
            </button>

            <span className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-background/85 px-2 py-1 text-xs font-medium text-foreground backdrop-blur">
              {PROVIDER_LABEL[video.provider]}
            </span>

            {canExpand && interactive && (
              <button
                type="button"
                aria-label="Kengaytirish"
                onClick={() => {
                  setExpanded(true);
                  setPlaying(true);
                }}
                className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-md bg-background/85 text-foreground opacity-0 backdrop-blur transition hover:bg-background focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Maximize2 className="size-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Kengaygan koʻrinish — `Dialog` primitivi EMAS, ataylab oddiy
          qatlam: Dialog kontentini 16:9 ga toʻliq moslash uchun uning
          standart padding/yopish tugmasi/markazlash qoidalarini birma-bir
          bekor qilish kerak boʻlardi. Bu yerda kerak boʻlgani — fon va
          bitta iframe. */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4 backdrop-blur-sm"
          onClick={closeExpanded}
          role="presentation"
        >
          <button
            type="button"
            aria-label="Yopish"
            onClick={closeExpanded}
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-md bg-background/90 text-foreground"
          >
            <X className="size-4" />
          </button>
          <div
            className="w-full max-w-5xl overflow-hidden rounded-xl bg-black"
            style={{ aspectRatio: aspect }}
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <iframe
              src={embedSrc(video)}
              title={`${PROVIDER_LABEL[video.provider]} video`}
              className="size-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
}
