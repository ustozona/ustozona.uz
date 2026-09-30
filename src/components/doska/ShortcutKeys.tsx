"use client";

import * as React from "react";

import { Kbd, KbdGroup } from "@/components/ui/kbd";

/* ════════════════════════════════════════════════════════════════════
   YORLIQ TUGMALARI — tooltip, menyu va yorliqlar roʻyxatida bir xil.

   `Mod` — boshqaruv tugmasi: Windows va Linuxda «Ctrl», Macda «⌘».
   Yorliqlar ishlovchisi (`useDoskaShortcuts`) ikkalasini ham qabul
   qiladi, shuning uchun bitta yozuv hamma joyda toʻgʻri.

   Platforma faqat brauzerda maʼlum. Serverda «Ctrl» chiziladi, Macda
   gidratatsiyadan keyin «⌘» ga almashadi — `useSyncExternalStore`
   ikki qiymatni bir-biriga aralashtirmaydi (gidratatsiya xatosi yoʻq).
   ════════════════════════════════════════════════════════════════════ */

const noop = () => () => {};

function useIsMac(): boolean {
  return React.useSyncExternalStore(
    noop,
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => false,
  );
}

export function ShortcutKeys({ keys, className }: { keys: readonly string[]; className?: string }) {
  const mac = useIsMac();
  return (
    <KbdGroup className={className}>
      {keys.map((key, i) => (
        <Kbd key={i}>{key === "Mod" ? (mac ? "⌘" : "Ctrl") : key}</Kbd>
      ))}
    </KbdGroup>
  );
}
