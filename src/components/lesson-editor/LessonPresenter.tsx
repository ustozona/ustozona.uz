"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import DOMPurify from "dompurify";
import { ChevronLeft, ChevronRight, Moon, Sun, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* ════════════════════════════════════════════════════════════════════
   TAQDIMOT REJIMI — darsni sinf ekranida slaydlar bilan oʻtish.

   LessonLab Planner'dagi «Dars rejimi»dan koʻchirilgan (planner
   2026-09-26 da qulflandi). Farqi: slaydlar alohida saqlanmaydi — ular
   har safar dars matnining OʻZIDAN yasaladi, shuning uchun muharrirda
   tuzatilgan xato taqdimotda ham darhol tuzalgan boʻladi. Ikkinchi
   nusxa yoʻq — ikkita manba bir-biridan uzoqlashib ketmaydi.

   Boʻlish qoidasi: har H1/H2 sarlavha — yangi slayd. Birinchi slayd —
   dars sarlavhasi (va sarlavhagacha boʻlgan matn). Sarlavhasiz uzun
   dars bitta slayd boʻladi — hech narsa yoʻqolmaydi.

   Boshqaruv: ← → / Space / PageUp PageDown (pult), Home/End, Esc.
   Matn DOMPurify'dan oʻtadi: AI qoʻshgan matn allaqachon tozalangan,
   lekin taqdimot uni `innerHTML` bilan chizadi — ikkinchi qavat arzon.
   ════════════════════════════════════════════════════════════════════ */

type Slide = { title: string; html: string };

function splitSlides(title: string, html: string): Slide[] {
  const doc = new DOMParser().parseFromString(DOMPurify.sanitize(html), "text/html");
  const slides: Slide[] = [{ title, html: "" }];
  for (const node of Array.from(doc.body.childNodes)) {
    if (node instanceof HTMLElement && (node.tagName === "H1" || node.tagName === "H2")) {
      slides.push({ title: node.textContent?.trim() ?? "", html: "" });
      continue;
    }
    const cur = slides[slides.length - 1];
    cur.html += node instanceof HTMLElement ? node.outerHTML : (node.textContent ?? "");
  }
  // Boʻsh birinchi slayd (sarlavhadan keyin darhol H2 boshlangan) ham qoladi —
  // u titul slayd vazifasini bajaradi.
  return slides;
}

export default function LessonPresenter({
  title,
  html,
  onClose,
}: {
  title: string;
  html: string;
  onClose: () => void;
}) {
  const t = useTranslations("LessonPresenter");
  const rootRef = useRef<HTMLDivElement>(null);
  const slides = useMemo(() => splitSlides(title, html), [title, html]);
  const [idx, setIdx] = useState(0);
  const [dark, setDark] = useState(false);

  const go = useCallback(
    (d: number) => setIdx((i) => Math.min(slides.length - 1, Math.max(0, i + d))),
    [slides.length],
  );

  const close = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    onClose();
  }, [onClose]);

  useEffect(() => {
    rootRef.current?.requestFullscreen?.().catch(() => {
      /* ruxsat berilmasa — oyna ichida toʻliq qatlam sifatida qoladi */
    });
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); go(1); }
      else if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); go(-1); }
      else if (e.key === "Home") setIdx(0);
      else if (e.key === "End") setIdx(slides.length - 1);
      else if (e.key === "Escape") close();
    };
    // Pult/klaviatura Esc bilan toʻliq ekrandan chiqsa — taqdimot ham yopiladi.
    const onFs = () => { if (!document.fullscreenElement) onClose(); };
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [go, close, onClose, slides.length]);

  const slide = slides[idx];

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
      className={cn(
        "fixed inset-0 z-50 flex flex-col",
        dark ? "bg-neutral-950 text-neutral-50" : "bg-white text-neutral-900",
      )}
    >
      <div className="flex shrink-0 items-center gap-2 px-4 py-3">
        <span className="text-caption tabular-nums opacity-70">
          {idx + 1} / {slides.length}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => setDark((d) => !d)} aria-label={t("theme")} title={t("theme")}>
            {dark ? <Sun /> : <Moon />}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={close} aria-label={t("close")} title={t("close")}>
            <X />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-8">
        <div className="mx-auto flex min-h-full max-w-5xl flex-col justify-center">
          <h2 className={cn("font-semibold tracking-tight", idx === 0 ? "text-5xl" : "text-4xl")}>
            {slide.title || title}
          </h2>
          {slide.html && (
            <div
              className={cn("lesson-prose mt-6", dark && "text-neutral-50")}
              style={{ zoom: 1.5 }}
              dangerouslySetInnerHTML={{ __html: slide.html }}
            />
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between px-4 py-3">
        <Button variant="ghost" onClick={() => go(-1)} disabled={idx === 0}>
          <ChevronLeft /> {t("prev")}
        </Button>
        <div className="flex gap-1" aria-hidden="true">
          {slides.map((_, i) => (
            <span
              key={i}
              className={cn("size-1.5 rounded-full", i === idx ? "bg-current" : "bg-current opacity-25")}
            />
          ))}
        </div>
        <Button variant="ghost" onClick={() => go(1)} disabled={idx === slides.length - 1}>
          {t("next")} <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
