"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineBanner } from "@/components/ui/inline-banner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import {
  dismissTgPromptAction,
  getTgDigestPreviewAction,
  getTgPromptAction,
} from "@/server/actions/tg-auth";
import type { TgConnection, TgDigestPreview } from "@/lib/tg-auth-types";
import { TelegramAuthDialog } from "./TelegramAuthDialog";

/* Bosh sahifadagi yumshoq taklif — Telegram ulanmagan, bot ochilmagan
   yoki telefon qoʻshilmagan ustozga.

   Majburiy EMAS (qaror: avval yumshoq, admin koʻrsatkichlariga qarab
   keyin hal qilinadi). Asosiy argument — foyda (ertangi darslar
   eslatmasi), «maʼlumot bering» emas. Tashkilot va maxfiylik vaʼdalari
   yozilmaydi.

   Koʻrsatish-koʻrsatmaslikni SERVER hal qiladi (`getTgPrompt`): foyda
   boʻlgandagina, «Keyinroq» tanaffuslari 3 → 7 → 14 kun, keyin butunlay
   toʻxtaydi. Hisob ustozda saqlanadi, brauzerda emas. Sozlamalar →
   Telegram har doim ochiq.

   «Namuna» — ustozning OʻZ darslari bilan bot yuboradigan kechki
   xabarning aynan oʻzi (`getTgDigestPreview`). */

export function TelegramConnectPrompt() {
  const t = useTranslations("TelegramPrompt");
  const [conn, setConn] = React.useState<TgConnection | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const load = React.useCallback(() => {
    getTgPromptAction()
      .then((p) => setConn(p?.conn ?? null))
      .catch(() => setConn(null));
  }, []);

  React.useEffect(load, [load]);

  const snooze = () => {
    setConn(null);
    // Yozilmasa — keyingi kirishda yana chiqadi, xolos.
    dismissTgPromptAction().catch(() => {});
  };

  if (!conn?.enabled) return null;

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
   serverda xabar yigʻilmasin. `null` — hali soʻralmagan. */
type PreviewState = null | "loading" | "error" | "empty" | TgDigestPreview;

function DigestPreview() {
  const t = useTranslations("TelegramPrompt");
  const [state, setState] = React.useState<PreviewState>(null);

  const fetchPreview = () => {
    setState("loading");
    getTgDigestPreviewAction()
      .then((p) => setState(p ?? "empty"))
      .catch(() => setState("error"));
  };

  return (
    <Popover onOpenChange={(open) => open && state === null && fetchPreview()}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="ghost">
          {t("preview")}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        {state === null || state === "loading" ? (
          <div className="flex items-center gap-2 text-body text-muted-foreground">
            <Spinner />
            {t("previewLoading")}
          </div>
        ) : state === "error" ? (
          <div className="flex flex-col items-start gap-2">
            <p className="text-body text-muted-foreground">{t("previewError")}</p>
            <Button size="sm" variant="outline" onClick={fetchPreview}>
              {t("previewRetry")}
            </Button>
          </div>
        ) : state === "empty" ? (
          <p className="text-body text-muted-foreground">{t("previewEmpty")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-caption text-muted-foreground">{t("previewTitle")}</p>
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
