"use client";

import * as React from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { ExternalLink, LayoutGrid, Maximize2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InlineBanner } from "@/components/ui/inline-banner";
import { useSidebar } from "@/components/ui/sidebar";
import { panelCardClass, panelCardHeaderClass } from "@/components/DashboardPage";
import { GAME_LABEL_KEYS, gamePath, isGameFile, type GameFile } from "@/lib/games";

/* ════════════════════════════════════════════════════════════════════
   OʻYINLAR PANELI — Ustozona kartasi ichida toʻliq balandlikdagi iframe.

   Iframe bilan muloqot faqat `postMessage` orqali va faqat oʻyinlar
   ORIGIN'i bilan (LessonLab `edugames/eg-embed.js`):
     ← `ustozona-games:nav`  qaysi oʻyin ochildi — manzil `/dashboard/
                             games/<nom>` ga almashadi (yangilansa yoki
                             ulashilsa oʻsha oʻyin ochiladi);
     → `ustozona-games:ctx`  mavzu (yorugʻ/qora) va til — foydalanuvchi
                             Ustozona'da almashtirsa, oʻyinlar ham.

   Xavfsizlik (avvalgi `/games` qobigʻi bilan bir xil):
     • xabar faqat iframe origin'i VA oʻsha oynadan qabul qilinadi;
     • nom `GAME_FILES` roʻyxatida boʻlishi SHART;
     • chipta (`#ll_ticket`) faqat BIRINCHI manzilga qoʻyiladi — keyingi
       oʻtishlarda (Katalog tugmasi) qayta yuborilmaydi.

   Oʻyin ochilganda Ustozona yon paneli ikonka holatiga yigʻiladi
   (Statistika sahifasidagi kabi — koʻproq joy), katalogga qaytganda
   yoki sahifadan chiqqanda avvalgi holatiga qaytadi.
   ════════════════════════════════════════════════════════════════════ */

const TELEGRAM_SETTINGS = "/dashboard/settings?section=telegram";
const HINT_DISMISS_KEY = "ugames_link_hint_dismissed";

export default function GamesPanel({
  base,
  initialGame,
  pin,
  ticket,
  notLinked,
}: {
  base: string;
  initialGame: GameFile | null;
  pin: string | null;
  ticket: string | null;
  notLinked: boolean;
}) {
  const t = useTranslations("GamesPage");
  const tRoutes = useTranslations("RouteLabels");
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  const { open, setOpen, isMobile } = useSidebar();
  const frameRef = React.useRef<HTMLIFrameElement>(null);
  const frameOrigin = React.useMemo(() => new URL(base).origin, [base]);

  const [game, setGame] = React.useState<GameFile | null>(initialGame);
  const [src, setSrc] = React.useState<string | null>(null);
  const [hintHidden, setHintHidden] = React.useState(true);

  const themeNow = React.useCallback(
    (): "dark" | "light" =>
      (resolvedTheme ?? (document.documentElement.classList.contains("dark") ? "dark" : "light")) === "dark"
        ? "dark"
        : "light",
    [resolvedTheme]
  );

  const frameUrl = React.useCallback(
    (target: GameFile | null, withTicket: boolean) => {
      const url = new URL(`${base}/${target ? `${target}.html` : ""}`);
      url.searchParams.set("theme", themeNow());
      url.searchParams.set("lang", locale);
      if (target === "live-play" && pin) url.searchParams.set("pin", pin);
      if (withTicket && ticket) url.hash = `ll_ticket=${ticket}`;
      return url.toString();
    },
    [base, locale, pin, ticket, themeNow]
  );

  // Iframe manzili mijozda, BIR MARTA: mavzu (next-themes) faqat shu
  // yerda maʼlum, chipta esa faqat birinchi manzilga qoʻyiladi.
  React.useEffect(() => {
    setSrc((cur) => cur ?? frameUrl(initialGame, true));
  }, [frameUrl, initialGame]);

  React.useEffect(() => {
    try {
      setHintHidden(localStorage.getItem(HINT_DISMISS_KEY) === "1");
    } catch {
      setHintHidden(false);
    }
  }, []);

  // ← Oʻyinlar: qaysi oʻyin ochildi
  React.useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== frameOrigin) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      const data = event.data as { type?: unknown; game?: unknown } | null;
      if (!data || data.type !== "ustozona-games:nav") return;

      const next = data.game === "index" ? null : isGameFile(data.game) ? data.game : undefined;
      if (next === undefined) return;
      setGame(next);
      const path = gamePath(next, "/dashboard/games");
      if (window.location.pathname !== path) window.history.replaceState(null, "", path);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [frameOrigin]);

  // → Oʻyinlar: mavzu va til (yuklanganda va oʻzgarganda)
  const sendCtx = React.useCallback(() => {
    frameRef.current?.contentWindow?.postMessage(
      { type: "ustozona-games:ctx", theme: themeNow(), lang: locale },
      frameOrigin
    );
  }, [frameOrigin, locale, themeNow]);
  React.useEffect(sendCtx, [sendCtx]);

  // Oʻyin ochiq — yon panel ikonka holatiga (faqat desktop). Biz yigʻgan
  // boʻlsak, qaytarib ochamiz; foydalanuvchi oʻzi yopgan boʻlsa tegmaymiz.
  const collapsedByUs = React.useRef(false);
  React.useEffect(() => {
    if (isMobile) return;
    if (game && open) {
      collapsedByUs.current = true;
      setOpen(false);
    } else if (!game && collapsedByUs.current) {
      collapsedByUs.current = false;
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- faqat oʻyin almashganda
  }, [game, isMobile]);
  React.useEffect(
    () => () => {
      if (collapsedByUs.current) setOpen(true);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- faqat chiqishda
    []
  );

  function toCatalog() {
    if (frameRef.current) frameRef.current.src = frameUrl(null, false);
  }

  function fullscreen() {
    frameRef.current?.requestFullscreen?.().catch(() => {
      /* brauzer ruxsat bermadi — oʻyinning oʻz tugmasi bor */
    });
  }

  function dismissHint() {
    setHintHidden(true);
    try {
      localStorage.setItem(HINT_DISMISS_KEY, "1");
    } catch {
      /* xususiy rejim — faqat shu safar yashiriladi */
    }
  }

  const title = game ? tRoutes(GAME_LABEL_KEYS[game]) : t("catalog");
  const standalone = `${base}/${game ? `${game}.html` : ""}`;

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-4 p-4 md:p-6">
      <Card className={panelCardClass}>
        <div className={`${panelCardHeaderClass} gap-2`}>
          <h1 className="min-w-0 flex-1 truncate text-title-sm">{title}</h1>
          {game && (
            <Button variant="ghost" size="sm" onClick={toCatalog}>
              <LayoutGrid />
              <span className="max-sm:sr-only">{t("catalog")}</span>
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={fullscreen} aria-label={t("fullscreen")} title={t("fullscreen")}>
            <Maximize2 />
          </Button>
          <Button asChild variant="ghost" size="icon-sm" aria-label={t("openNewTab")} title={t("openNewTab")}>
            <a href={standalone} target="_blank" rel="noopener noreferrer">
              <ExternalLink />
            </a>
          </Button>
        </div>

        {notLinked && !hintHidden && (
          <InlineBanner variant="info" icon={Send} onDismiss={dismissHint} dismissLabel={t("later")}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="min-w-0 flex-1">{t("linkHint")}</span>
              <Button size="sm" asChild>
                <Link href={TELEGRAM_SETTINGS}>{t("linkAction")}</Link>
              </Button>
            </div>
          </InlineBanner>
        )}

        {src && (
          <iframe
            ref={frameRef}
            src={src}
            title={t("frameTitle")}
            onLoad={sendCtx}
            className="min-h-0 w-full flex-1 border-0 bg-background"
            allow="fullscreen; camera; autoplay; clipboard-read; clipboard-write; screen-wake-lock"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
      </Card>
    </div>
  );
}
