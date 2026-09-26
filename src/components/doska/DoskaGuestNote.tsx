"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { useDoskaStore } from "@/lib/doska/store";
import { IconClose, IconInfo } from "./icons";

/**
 * MEHMON REJIMI ESLATMASI.
 *
 * Hech narsani bloklamaydi va yoʻlni toʻsmaydi — faqat holatni ochiq
 * aytadi. Bu toʻlov devori emas: ekran shu holicha bepul ishlaydi,
 * kirish esa sinf roʻyxatini olib keladi.
 *
 * Ekran boʻsh boʻlsa koʻrinmaydi — birinchi vidjet qoʻyilgandan keyin
 * chiqadi, chunki oʻshanda "bu ish qayerda saqlanadi?" savoli tugʻiladi.
 */
export function DoskaGuestNote() {
  const [dismissed, setDismissed] = React.useState(false);
  const hasWidgets = useDoskaStore(
    (s) =>
      (s.deck.screens.find((x) => x.id === s.activeScreenId)?.widgets.length ?? 0) > 0,
  );
  const hydrated = useDoskaStore((s) => s.hydrated);
  const t = useTranslations("Doska.guestNote");

  if (dismissed || !hydrated || !hasWidgets) return null;

  return (
    <div className="doska-bar doska-ctl flex items-center gap-2 py-1 pr-1 pl-4">
        <IconInfo className="text-muted-foreground size-5 shrink-0" />
        <p className="text-xs">
          {t.rich("text", {
            link: (chunks) => (
              <Link href="/login" className="underline underline-offset-2">
                {chunks}
              </Link>
            ),
          })}
        </p>
        <button
          type="button"
          aria-label={t("dismiss")}
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground hover:bg-muted grid size-11 shrink-0 place-items-center rounded-lg transition-colors"
        >
          <IconClose className="size-5" />
        </button>
    </div>
  );
}
