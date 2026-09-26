"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ClipboardCheck, ExternalLink, Maximize2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gamePath, isGameFile, type GameFile } from "@/lib/games";

/* ════════════════════════════════════════════════════════════════════
   USTOZONA-GAMES QOBIGʻI — yupqa sarlavha + toʻliq ekranli iframe.

   Oʻyin ichida sahifa almashsa (katalog → Arqon), iframe ota sahifaga
   `postMessage` bilan faqat oʻyin NOMINI yuboradi (LessonLab
   `edugames/eg-embed.js`). Biz manzilni `/games/<nom>` ga almashtiramiz
   — yangilanganda oʻyin yoʻqolmaydi, havola ulashiladi.

   Xavfsizlik:
     • Xabar faqat iframe ORIGIN'idan qabul qilinadi (`event.origin`).
     • Nom `GAME_FILES` roʻyxatida boʻlishi SHART — aks holda eʼtiborsiz.
     • `replaceState` — tarixga yangi qadam qoʻshilmaydi, «Orqaga»
       tugmasi Ustozonaning oldingi sahifasiga qaytaradi.

   `allow`: kamera (QR skaner/Poyga QR), toʻliq ekran (proyektor),
   avtoijro (oʻyin ovozlari), clipboard (PIN nusxalash).
   ════════════════════════════════════════════════════════════════════ */

const TELEGRAM_BOT_URL = "https://t.me/uzlessonlabbot";

export default function GamesFrame({
  base,
  initialGame,
  src,
  homeHref,
  signedIn,
}: {
  base: string;
  initialGame: GameFile | null;
  src: string;
  homeHref: string;
  signedIn: boolean;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [game, setGame] = useState<GameFile | null>(initialGame);
  const frameOrigin = new URL(base).origin;

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== frameOrigin) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      const data = event.data as { type?: unknown; game?: unknown; title?: unknown } | null;
      if (!data || data.type !== "ustozona-games:nav") return;

      const next = data.game === "index" ? null : isGameFile(data.game) ? data.game : undefined;
      if (next === undefined) return;
      setGame(next);
      const path = gamePath(next);
      if (window.location.pathname !== path) window.history.replaceState(null, "", path);
      if (typeof data.title === "string" && data.title.length <= 120) document.title = data.title;
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [frameOrigin]);

  const currentSrc = game === initialGame ? src : `${base}/${game ? `${game}.html` : ""}`;

  function fullscreen() {
    frameRef.current?.requestFullscreen?.().catch(() => {
      /* brauzer ruxsat bermadi — oʻyinning oʻz tugmasi bor */
    });
  }

  return (
    <div className="flex h-dvh w-full flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card px-3 sm:px-4">
        <Button asChild variant="ghost" size="icon-sm" aria-label="Ustozonaga qaytish">
          <Link href={homeHref}>
            <ArrowLeft />
          </Link>
        </Button>

        <Link href="/games" className="flex min-w-0 items-center gap-2" aria-label="Ustozona-Games bosh sahifasi">
          {/* eslint-disable-next-line @next/next/no-img-element -- kichik statik SVG logo */}
          <img src="/ustozona-games.svg" alt="" width={28} height={28} className="size-7 shrink-0" />
          <span className="truncate text-title-sm">Ustozona-Games</span>
        </Link>

        <nav className="ml-auto flex items-center gap-1" aria-label="Ustozona-Games">
          {signedIn && (
            <Button asChild variant="ghost" size="sm" className="max-sm:hidden">
              <Link href="/baholash">
                <ClipboardCheck />
                Baholash
              </Link>
            </Button>
          )}
          {!signedIn && (
            <Button asChild variant="ghost" size="sm" className="max-sm:hidden">
              <a href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer">
                <Send />
                Telegram bot
              </a>
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={fullscreen} aria-label="Toʻliq ekran" title="Toʻliq ekran">
            <Maximize2 />
          </Button>
          <Button asChild variant="ghost" size="icon-sm" aria-label="Yangi oynada ochish" title="Yangi oynada ochish">
            <a href={currentSrc} target="_blank" rel="noopener noreferrer">
              <ExternalLink />
            </a>
          </Button>
        </nav>
      </header>

      <iframe
        ref={frameRef}
        src={src}
        title="Ustozona-Games"
        className="min-h-0 w-full flex-1 border-0 bg-background"
        allow="fullscreen; camera; autoplay; clipboard-read; clipboard-write; screen-wake-lock"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
