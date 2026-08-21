"use client";

import * as React from "react";
import Link from "next/link";
import { Info, X } from "lucide-react";

import { useDoskaStore } from "@/lib/doska/store";

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

  if (dismissed || !hydrated || !hasWidgets) return null;

  return (
    <div className="doska-bar bg-background flex items-center gap-2 rounded-full border px-4 py-2 shadow-md">
        <Info className="text-muted-foreground size-4 shrink-0" />
        <p className="text-xs">
          Ekran shu brauzerda saqlanadi.{" "}
          <Link href="/login" className="underline underline-offset-2">
            Kirsangiz
          </Link>{" "}
          sinf roʻyxatingiz ulanadi.
        </p>
        <button
          type="button"
          aria-label="Eslatmani yopish"
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground ml-1 shrink-0"
        >
          <X className="size-4" />
        </button>
    </div>
  );
}
