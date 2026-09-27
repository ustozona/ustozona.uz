"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Check, Copy, Maximize2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ════════════════════════════════════════════════════════════════════
   QOʻSHILISH BLOKI — kod, QR, havola, Telegram, proyektor.

   Oʻqituvchining ekranda kutayotgan YAGONA narsasi — bolalar qanday
   kiradi. Shuning uchun uchala yoʻl bir joyda:
     • sinfda   — «Ekranga chiqarish»: toʻliq ekranda katta QR va kod
                  (proyektorga), bolalar telefon kamerasi bilan kiradi;
     • masofada — «Telegram'da ulashish»: sinf guruhiga bitta bosishda;
     • qoʻlda   — kodni `/play` ga yozish (QR oʻqimaydigan telefon).

   QR brauzerda chiziladi (`qrcode`), tashqi xizmatga manzil
   yuborilmaydi — havolada sessiya kodi bor.
   ════════════════════════════════════════════════════════════════════ */

export function playUrl(origin: string, joinCode: string, shellId?: string | null): string {
  const base = `${origin}/play/${joinCode}`;
  return shellId ? `${base}?game=${encodeURIComponent(shellId)}` : base;
}

function useQrSvg(text: string): string | null {
  const [svg, setSvg] = useState<string | null>(null);
  useEffect(() => {
    if (!text) return;
    let cancelled = false;
    import("qrcode")
      .then((QR) => QR.toString(text, { type: "svg", margin: 1, errorCorrectionLevel: "M" }))
      .then((out) => !cancelled && setSvg(out))
      .catch(() => {
        /* QR chizilmasa kod va havola baribir ishlaydi */
      });
    return () => {
      cancelled = true;
    };
  }, [text]);
  return svg;
}

export function JoinShare({
  joinCode,
  shellId,
  shareText,
}: {
  joinCode: string;
  shellId?: string | null;
  /** Telegram xabari matni (havola avtomatik qoʻshiladi). */
  shareText: string;
}) {
  const t = useTranslations("LaunchHub");
  // Blok faqat mijozda, foydalanuvchi amalidan keyin chiziladi (dialog
  // ichida) — server renderi yoʻq, shuning uchun gidratsiya farqi ham yoʻq.
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const url = origin ? playUrl(origin, joinCode, shellId) : "";
  const svg = useQrSvg(url);
  const [copied, setCopied] = useState(false);
  const [projector, setProjector] = useState(false);
  const host = origin.replace(/^https?:\/\//, "");

  function copy() {
    if (!url) return;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        /* clipboard ruxsati yoʻq — havola ekranda koʻrinib turibdi */
      });
  }

  const telegramHref = url
    ? `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareText)}`
    : undefined;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-4 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={() => setProjector(true)}
        aria-label={t("projector")}
        className="flex size-36 shrink-0 items-center justify-center self-center rounded-lg bg-white p-2 transition-transform duration-fast hover:scale-[1.02] [&>svg]:size-full"
        // QR kutubxonasi toza SVG qaytaradi — foydalanuvchi matni yoʻq.
        dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-caption text-muted-foreground">{t("joinSteps", { host: `${host}/play` })}</p>
          <p className="font-mono text-headline tracking-widest text-foreground">{joinCode}</p>
          {url && <p className="truncate text-caption text-muted-foreground">{url}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setProjector(true)}>
            <Maximize2 />
            {t("projector")}
          </Button>
          <Button size="sm" variant="outline" className="shadow-none" onClick={copy}>
            {copied ? <Check /> : <Copy />}
            {copied ? t("copied") : t("copyLink")}
          </Button>
          {telegramHref && (
            <Button size="sm" variant="outline" className="shadow-none" asChild>
              <a href={telegramHref} target="_blank" rel="noopener noreferrer">
                <Send />
                {t("shareTelegram")}
              </a>
            </Button>
          )}
        </div>
      </div>
      {projector && (
        <ProjectorJoin
          joinCode={joinCode}
          host={`${host}/play`}
          svg={svg}
          onClose={() => setProjector(false)}
        />
      )}
    </div>
  );
}

/** Proyektor uchun toʻliq ekran: katta QR + kod. Sinf 5 metrdan oʻqiydi. */
function ProjectorJoin({
  joinCode,
  host,
  svg,
  onClose,
}: {
  joinCode: string;
  host: string;
  svg: string | null;
  onClose: () => void;
}) {
  const t = useTranslations("LaunchHub");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Proyektorda brauzer paneli ham koʻrinmasin — ruxsat berilmasa jim.
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => {
      window.removeEventListener("keydown", onKey);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("projector")}
      data-surface="stage"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-8 bg-background p-8 animate-in fade-in-0 duration-fast"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        aria-label={t("closeProjector")}
        className="absolute right-4 top-4 text-muted-foreground"
      >
        <X />
      </Button>
      <p className="text-center text-title text-muted-foreground">{t("joinSteps", { host })}</p>
      <div className="flex flex-col items-center gap-8 lg:flex-row lg:gap-16">
        {svg && (
          <div
            className="aspect-square w-[min(60vw,50vh)] rounded-2xl bg-white p-4 [&>svg]:size-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        )}
        <p
          className="font-mono font-semibold leading-none tracking-widest text-foreground"
          // Proyektor oʻlchami — ekran eniga bogʻliq, shkala roli yoʻq
          // (Doska `JoinOverlay` bilan bir xil yondashuv).
          style={{ fontSize: "min(14vw, 11rem)" }}
        >
          {joinCode}
        </p>
      </div>
    </div>,
    document.body,
  );
}
