"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { TelegramIcon } from "@/components/telegram-icon";
import { TelegramAuthDialog } from "./TelegramAuthDialog";

/* «Telegram orqali davom etish» — kirish va roʻyxat sahifalari uchun
   bitta tugma.

   Ustozona boti sozlangan boʻlsa (`botEnabled`) — kirish oynasi:
   tanish telegram kiradi, yangisi shu yerning oʻzida roʻyxatdan oʻtadi.
   Sozlanmagan boʻlsa — eski yoʻl (LessonLab botidagi roʻyxat havolasi),
   yaʼni token Vercel'ga qoʻyilmaguncha hech narsa oʻzgarmaydi.

   ⚠️ Fallback `<a>` — `Link` emas: tashqi (t.me) havola. */
export function TelegramContinueButton({
  label,
  botEnabled,
  fallbackUrl,
}: {
  label: string;
  botEnabled?: boolean;
  fallbackUrl?: string;
}) {
  const [open, setOpen] = React.useState(false);

  if (botEnabled) {
    return (
      <Field>
        <Button variant="outline" type="button" onClick={() => setOpen(true)}>
          <TelegramIcon className="h-4 w-4" />
          {label}
        </Button>
        <TelegramAuthDialog kind="login" open={open} onOpenChange={setOpen} />
      </Field>
    );
  }

  if (!fallbackUrl) return null;
  return (
    <Field>
      <Button variant="outline" type="button" asChild>
        <a href={fallbackUrl}>
          <TelegramIcon className="h-4 w-4" />
          {label}
        </a>
      </Button>
    </Field>
  );
}
