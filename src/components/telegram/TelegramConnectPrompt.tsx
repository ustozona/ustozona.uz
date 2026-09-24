"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineBanner } from "@/components/ui/inline-banner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { getTgConnectionAction, getTgDigestPreviewAction } from "@/server/actions/tg-auth";
import { useTimetableStore } from "@/store/useTimetableStore";
import type { TgConnection, TgDigestPreview } from "@/lib/tg-auth-types";
import { TelegramAuthDialog } from "./TelegramAuthDialog";

/* Bosh sahifadagi yumshoq taklif — Telegram ulanmagan, bot ochilmagan
   yoki telefon qoʻshilmagan ustozga.

   Majburiy EMAS (qaror: avval yumshoq, admin koʻrsatkichlariga qarab
   keyin hal qilinadi). Asosiy argument — foyda (ertangi darslar
   eslatmasi), «maʼlumot bering» emas. Tashkilot va maxfiylik vaʼdalari
   yozilmaydi.

   Uch qoida:
   - FOYDA BOʻLGANDA. Jadvali boʻsh ustozga xabar baribir kelmaydi —
     taklif ham chiqmaydi.
   - KOʻRSATIB. «Namuna» — ustozning OʻZ ertangi darslari bilan bot
     yuboradigan xabarning aynan oʻzi (`getTgDigestPreview`).
   - BEZOVTA QILMAY. Har «Keyinroq» tanaffusni uzaytiradi (3 → 7 → 14
     kun), uchinchisidan keyin taklif shu brauzerda butunlay toʻxtaydi.
     Sozlamalar → Telegram har doim ochiq. Bu faqat shu brauzerdagi
     qulaylik, shuning uchun localStorage. */

const SNOOZE_KEY = "uz_tg_prompt_snooze_until";
const COUNT_KEY = "uz_tg_prompt_dismissals";
const DAY_MS = 24 * 60 * 60 * 1000;
const SNOOZE_DAYS = [3, 7, 14];

function readNum(key: string): number {
  try {
    return Number(localStorage.getItem(key) ?? 0) || 0;
  } catch {
    return 0;
  }
}

function suppressed(): boolean {
  return readNum(COUNT_KEY) >= SNOOZE_DAYS.length || readNum(SNOOZE_KEY) > Date.now();
}

export function TelegramConnectPrompt() {
  const t = useTranslations("TelegramPrompt");
  const [conn, setConn] = React.useState<TgConnection | null>(null);
  const [hidden, setHidden] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const hasLessons = useTimetableStore((s) => s.versions.some((v) => v.events.length > 0));

  const load = React.useCallback(() => {
    getTgConnectionAction()
      .then(setConn)
      .catch(() => setConn(null));
  }, []);

  React.useEffect(() => {
    if (suppressed()) return;
    setHidden(false);
    load();
  }, [load]);

  const snooze = () => {
    try {
      const n = readNum(COUNT_KEY);
      const days = SNOOZE_DAYS[Math.min(n, SNOOZE_DAYS.length - 1)];
      localStorage.setItem(COUNT_KEY, String(n + 1));
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + days * DAY_MS));
    } catch {
      // Saqlanmasa — faqat shu seansda yashiriladi.
    }
    setHidden(true);
  };

  if (hidden || !hasLessons || !conn?.enabled) return null;

  const needsLink = !conn.linked;
  const needsBot = conn.linked && !conn.botActive;
  const needsPhone = conn.linked && conn.botActive && !conn.phone;
  if (!needsLink && !needsBot && !needsPhone) return null;

  return (
    <>
      <InlineBanner variant="info" icon={Send} onDismiss={snooze} dismissLabel={t("later")}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="min-w-0 flex-1">
            {needsLink ? t("link") : needsBot ? t("startBot") : t("phone")}
          </span>
          <DigestPreview />
          {needsLink ? (
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              {t("linkAction")}
            </Button>
          ) : (
            conn.botUrl && (
              <Button size="sm" asChild>
                <a href={conn.botUrl} target="_blank" rel="noopener noreferrer">
                  {t("openBot")}
                </a>
              </Button>
            )
          )}
        </div>
      </InlineBanner>
      <TelegramAuthDialog
        kind="link"
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) load();
        }}
        onLinked={load}
      />
    </>
  );
}

/* Namuna birinchi ochilganda yuklanadi — banner koʻringan har safar
   serverda xabar yigʻilmasin. */
function DigestPreview() {
  const t = useTranslations("TelegramPrompt");
  const [state, setState] = React.useState<"idle" | "loading" | "empty" | TgDigestPreview>("idle");

  const load = (open: boolean) => {
    if (!open || state !== "idle") return;
    setState("loading");
    getTgDigestPreviewAction()
      .then((p) => setState(p ?? "empty"))
      .catch(() => setState("idle"));
  };

  return (
    <Popover onOpenChange={load}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost">
          {t("preview")}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        {state === "idle" || state === "loading" ? (
          <div className="flex items-center gap-2 text-body text-muted-foreground">
            <Spinner />
            {t("previewLoading")}
          </div>
        ) : state === "empty" ? (
          <p className="text-body text-muted-foreground">{t("previewEmpty")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-caption text-muted-foreground">
              {state.kind === "evening" ? t("previewEvening") : t("previewMorning")}
            </p>
            {/* Telegram pufagiga oʻxshash — matn bot yuboradiganining aynan oʻzi. */}
            <div className="rounded-lg bg-muted px-3 py-2 text-body">
              {state.lines.map((line, i) =>
                line ? (
                  <p key={i} className={i === 0 ? "font-semibold" : undefined}>
                    {line}
                  </p>
                ) : (
                  <div key={i} className="h-2" />
                )
              )}
            </div>
            {state.buttons.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {state.buttons.map((b) => (
                  <span
                    key={b}
                    className="flex-1 rounded-md border border-border px-2 py-1 text-center text-caption"
                  >
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
