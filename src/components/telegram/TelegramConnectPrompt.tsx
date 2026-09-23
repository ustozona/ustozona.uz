"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineBanner } from "@/components/ui/inline-banner";
import { getTgConnectionAction } from "@/server/actions/tg-auth";
import type { TgConnection } from "@/lib/tg-auth-types";
import { TelegramAuthDialog } from "./TelegramAuthDialog";

/* Bosh sahifadagi yumshoq taklif — Telegram ulanmagan yoki telefon
   qoʻshilmagan ustozga.

   Majburiy EMAS (qaror: avval yumshoq, admin koʻrsatkichlariga qarab
   keyin hal qilinadi). «Keyinroq» bosilsa 3 kun koʻrinmaydi — bu faqat
   shu brauzerdagi qulaylik, shuning uchun localStorage.

   Asosiy argument — foyda (ertangi darslar eslatmasi), «maʼlumot bering»
   emas. Tashkilot va maxfiylik vaʼdalari yozilmaydi. */

const SNOOZE_KEY = "uz_tg_prompt_snooze_until";
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

function snoozed(): boolean {
  try {
    return Number(localStorage.getItem(SNOOZE_KEY) ?? 0) > Date.now();
  } catch {
    return false;
  }
}

export function TelegramConnectPrompt() {
  const t = useTranslations("TelegramPrompt");
  const [conn, setConn] = React.useState<TgConnection | null>(null);
  const [hidden, setHidden] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const load = React.useCallback(() => {
    getTgConnectionAction()
      .then(setConn)
      .catch(() => setConn(null));
  }, []);

  React.useEffect(() => {
    if (snoozed()) return;
    setHidden(false);
    load();
  }, [load]);

  const snooze = () => {
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    } catch {
      // Saqlanmasa — faqat shu seansda yashiriladi.
    }
    setHidden(true);
  };

  if (hidden || !conn?.enabled) return null;

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
