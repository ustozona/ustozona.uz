"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { useDoskaStore } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";
import { displayHost, normalizeUrl, videoSource } from "@/lib/doska/web";
import { SettingsSection } from "../SettingsFields";
import { IconEmbed, IconLink, IconVideo } from "../icons";
import { WidgetButton } from "./WidgetButton";
import { WidgetEmpty } from "./WidgetEmpty";

/* ════════════════════════════════════════════════════════════════════
   VIDEO · HAVOLA · SAYT — tashqi mazmun doskada
   (docs/doska-referens-koriklari.md R418).

   Uchalasi bitta naqsh: holatda faqat `url` (+ havolada `caption`),
   qoʻyilganda sozlama kartasi ochiladi, boʻsh vidjet — `WidgetEmpty`.

   • Video — videoxosting havolasi yoki .mp4 fayl, oʻynatgich vidjet
     ichida. Videoxosting kuzatuvsiz domen orqali (`lib/doska/web.ts`).
   • Havola — katta yozuv va «Ochish» tugmasi: sahifa YANGI varaqda
     ochiladi, doska oʻz joyida qoladi.
   • Sayt — istalgan sahifa iframe ichida. Koʻp saytlar oʻzini
     joylashni taqiqlaydi (brauzer boʻsh oyna koʻrsatadi) — shuning
     uchun ostida doim «Yangi varaqda ochish» zaxira yoʻli turadi.

   Iframe ichidagi bosish vidjetni surmaydi (hodisa iframeʼdan
   chiqmaydi) — sudrash uchun tepada ingichka sarlavha qatori bor.
   ════════════════════════════════════════════════════════════════════ */

function readUrl(state: DoskaWidget["state"]) {
  return {
    url: typeof state.url === "string" ? state.url : "",
    caption: typeof state.caption === "string" ? state.caption : "",
  };
}

function openInTab(href: string) {
  window.open(href, "_blank", "noopener,noreferrer");
}

/** Sudrash uchun sarlavha qatori: domen va (boʻlsa) «yangi varaqda» tugmasi. */
function FrameHeader({ host, href, openLabel }: { host: string; href: string; openLabel: string }) {
  return (
    <div className="flex h-9 shrink-0 items-center gap-2 px-3 text-sm">
      <span className="min-w-0 flex-1 truncate opacity-70">{host}</span>
      <WidgetButton onClick={() => openInTab(href)} className="h-7 px-3 text-xs">
        {openLabel}
      </WidgetButton>
    </div>
  );
}

/* ── Video ───────────────────────────────────────────────────────── */

export function VideoWidget({ widget }: { widget: DoskaWidget }) {
  const toggleSettings = useDoskaStore((s) => s.toggleSettings);
  const t = useTranslations("Doska.web");
  const { url } = readUrl(widget.state);
  const source = videoSource(url);
  const parsed = normalizeUrl(url);

  if (!source || !parsed) {
    return (
      <WidgetEmpty
        Icon={IconVideo}
        text={url.trim() ? t("videoUnsupported") : t("videoEmpty")}
        action={t("enter")}
        onAction={() => toggleSettings(widget.id)}
      />
    );
  }

  return (
    <div className="doska-card flex size-full flex-col overflow-hidden p-0" data-card="slate">
      <FrameHeader host={displayHost(parsed)} href={parsed.href} openLabel={t("openShort")} />
      <div className="min-h-0 flex-1 bg-black">
        {source.type === "iframe" ? (
          <iframe
            src={source.src}
            title={t("videoTitle")}
            className="size-full border-0"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <video src={source.src} controls playsInline className="size-full object-contain" data-doska-no-drag="" />
        )}
      </div>
    </div>
  );
}

/* ── Havola ──────────────────────────────────────────────────────── */

export function LinkWidget({ widget }: { widget: DoskaWidget }) {
  const toggleSettings = useDoskaStore((s) => s.toggleSettings);
  const t = useTranslations("Doska.web");
  const { url, caption } = readUrl(widget.state);
  const parsed = normalizeUrl(url);

  if (!parsed) {
    return (
      <WidgetEmpty
        Icon={IconLink}
        text={url.trim() ? t("invalid") : t("linkEmpty")}
        action={t("enter")}
        onAction={() => toggleSettings(widget.id)}
      />
    );
  }

  const host = displayHost(parsed);
  return (
    <div className="doska-card flex size-full flex-col items-center justify-center gap-[3cqw] p-[5cqw] text-center" data-card="slate">
      <span aria-hidden="true" className="opacity-60" style={{ width: "clamp(1.25rem, 10cqw, 4rem)" }}>
        <IconLink className="size-full" />
      </span>
      <p className="line-clamp-2 leading-tight font-semibold" style={{ fontSize: "clamp(0.9rem, 8cqw, 3rem)" }}>
        {caption.trim() || host}
      </p>
      {caption.trim() && (
        <p className="truncate opacity-70" style={{ fontSize: "clamp(0.75rem, 4cqw, 1.4rem)" }}>
          {host}
        </p>
      )}
      <WidgetButton
        tone="primary"
        onClick={() => openInTab(parsed.href)}
        className="min-h-11 px-[6cqw] py-[2.5cqw] font-semibold"
        style={{ fontSize: "clamp(0.85rem, 4.5cqw, 1.5rem)" }}
      >
        {t("open")}
      </WidgetButton>
    </div>
  );
}

/* ── Sayt (embed) ────────────────────────────────────────────────── */

export function EmbedWidget({ widget }: { widget: DoskaWidget }) {
  const toggleSettings = useDoskaStore((s) => s.toggleSettings);
  const t = useTranslations("Doska.web");
  const { url } = readUrl(widget.state);
  const parsed = normalizeUrl(url);

  if (!parsed) {
    return (
      <WidgetEmpty
        Icon={IconEmbed}
        text={url.trim() ? t("invalid") : t("embedEmpty")}
        action={t("enter")}
        onAction={() => toggleSettings(widget.id)}
      />
    );
  }

  return (
    <div className="doska-card flex size-full flex-col overflow-hidden p-0" data-card="slate">
      <FrameHeader host={displayHost(parsed)} href={parsed.href} openLabel={t("openShort")} />
      <iframe
        src={parsed.href}
        title={displayHost(parsed)}
        className="min-h-0 w-full flex-1 border-0 bg-white"
        // Sahifa oʻz skriptlari bilan ishlaydi, lekin doskani boshqa
        // manzilga olib keta olmaydi (`allow-top-navigation` YOʻQ).
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
        allow="fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}

/* ── Sozlama kartasi (uchalasiga umumiy) ─────────────────────────── */

function UrlSettings({ widget, hint, withCaption }: { widget: DoskaWidget; hint: string; withCaption?: boolean }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.web");
  const { url, caption } = readUrl(widget.state);
  const invalid = url.trim() !== "" && !normalizeUrl(url);

  return (
    <>
      <SettingsSection label={t("url")}>
        <Input
          autoFocus
          value={url}
          inputMode="url"
          spellCheck={false}
          placeholder="https://"
          aria-label={t("url")}
          aria-invalid={invalid}
          onChange={(e) => patch(widget.id, { url: e.target.value })}
        />
        <p className="text-muted-foreground text-xs leading-snug">{invalid ? t("invalid") : hint}</p>
      </SettingsSection>
      {withCaption && (
        <SettingsSection label={t("caption")}>
          <Input
            value={caption}
            maxLength={80}
            placeholder={t("captionPlaceholder")}
            aria-label={t("caption")}
            onChange={(e) => patch(widget.id, { caption: e.target.value })}
          />
        </SettingsSection>
      )}
    </>
  );
}

export function VideoSettings({ widget }: { widget: DoskaWidget }) {
  const t = useTranslations("Doska.web");
  return <UrlSettings widget={widget} hint={t("videoHint")} />;
}

export function LinkSettings({ widget }: { widget: DoskaWidget }) {
  const t = useTranslations("Doska.web");
  return <UrlSettings widget={widget} hint={t("linkHint")} withCaption />;
}

export function EmbedSettings({ widget }: { widget: DoskaWidget }) {
  const t = useTranslations("Doska.web");
  return <UrlSettings widget={widget} hint={t("embedHint")} />;
}
