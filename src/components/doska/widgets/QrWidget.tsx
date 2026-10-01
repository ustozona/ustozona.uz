"use client";

import * as React from "react";
import QRCode from "qrcode";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import { useDoskaStore } from "@/lib/doska/store";
import type { DoskaWidget } from "@/lib/doska/types";
import { SettingsSection } from "../SettingsFields";
import { WidgetEmpty } from "./WidgetEmpty";
import { IconQr } from "../icons";

/* ════════════════════════════════════════════════════════════════════
   QR — havola yoki matn, oʻquvchi telefon bilan skanerlaydi
   (docs/doska-referens-koriklari.md R418).

   Masalan: topshiriq havolasi, uy vazifasi sahifasi, video. Kod
   brauzerda chiziladi (`qrcode`), serverga hech narsa yuborilmaydi.

   ⚠️ Kod DOIM qora-oq — uslubdan rang olmaydi. Rangli yoki past
   kontrastli kodni proyektordan telefon oʻqimaydi.

   Boʻsh vidjet — ichida «Havola kiriting» tugmasi, sozlama kartasini
   ochadi (§2.9, qoida 4). Qoʻyilganda karta oʻzi ochiladi
   (`openSettingsOnAdd`).
   ════════════════════════════════════════════════════════════════════ */

/** QR sigʻimi — undan uzun matn kodni zichlashtirib, uzoqdan oʻqib boʻlmas qiladi. */
const MAX_TEXT = 500;

function readQr(state: DoskaWidget["state"]) {
  return {
    text: typeof state.text === "string" ? state.text.slice(0, MAX_TEXT) : "",
    caption: typeof state.caption === "string" ? state.caption : "",
  };
}

export function QrWidget({ widget }: { widget: DoskaWidget }) {
  const toggleSettings = useDoskaStore((s) => s.toggleSettings);
  const t = useTranslations("Doska.qr");
  const { text, caption } = readQr(widget.state);
  const [svg, setSvg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!text.trim()) return;
    let cancelled = false;
    QRCode.toString(text.trim(), { type: "svg", margin: 1, errorCorrectionLevel: "M" })
      .then((out) => !cancelled && setSvg(out))
      .catch(() => !cancelled && setSvg(null));
    return () => {
      cancelled = true;
    };
  }, [text]);

  if (!text.trim()) {
    return (
      <WidgetEmpty Icon={IconQr} text={t("empty")} action={t("enter")} onAction={() => toggleSettings(widget.id)} />
    );
  }

  return (
    // Oq qogʻoz — kod qora-oq boʻlishi shart (izohga qarang).
    <div className="flex size-full flex-col items-center justify-center gap-[3cqw] rounded-[var(--doska-card-radius)] bg-white p-[5cqw] text-black shadow-sm">
      {svg ? (
        <div
          role="img"
          aria-label={t("aria", { text })}
          className="aspect-square min-h-0 w-auto flex-1 [&>svg]:size-full"
          // `qrcode` chiqargan SVG — faqat <path>, foydalanuvchi matni
          // uning ichiga yozilmaydi (kod sifatida kodlanadi).
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="min-h-0 flex-1" />
      )}
      {caption && (
        <p className="w-full truncate text-center leading-tight font-semibold" style={{ fontSize: "clamp(0.8rem, 7cqw, 3rem)" }}>
          {caption}
        </p>
      )}
    </div>
  );
}

/* ── Sozlama kartasi ─────────────────────────────────────────────── */

export function QrSettings({ widget }: { widget: DoskaWidget }) {
  const patch = useDoskaStore((s) => s.patchWidgetState);
  const t = useTranslations("Doska.qr");
  const { text, caption } = readQr(widget.state);

  return (
    <>
      <SettingsSection label={t("text")}>
        <Input
          autoFocus
          value={text}
          maxLength={MAX_TEXT}
          placeholder="https://"
          aria-label={t("text")}
          onChange={(e) => patch(widget.id, { text: e.target.value })}
        />
      </SettingsSection>
      <SettingsSection label={t("caption")}>
        <Input
          value={caption}
          maxLength={60}
          placeholder={t("captionPlaceholder")}
          aria-label={t("caption")}
          onChange={(e) => patch(widget.id, { caption: e.target.value })}
        />
      </SettingsSection>
    </>
  );
}
