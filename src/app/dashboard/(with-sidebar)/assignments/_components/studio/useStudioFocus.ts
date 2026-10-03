"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSidebar } from "@/components/ui/sidebar";

/* ════════════════════════════════════════════════════════════════════
   STUDIYA «FOKUS REJIMI» — ish ustunlariga butun ekran.

   Oʻqituvchi ustunlar ustida uch qavat koʻradi: brauzer (tablar, manzil
   satri), Ustozona sarlavhasi va studiya qatori. Bitta bosishda:
     1. brauzer toʻliq ekranga oʻtadi (tablar va manzil satri yoʻqoladi);
     2. Ustozona sarlavhasi yashiriladi (`html[data-studio-focus]`,
        globals.css — `Header` komponentining oʻziga tegilmaydi);
     3. yon panel yigʻiladi.
   Chiqish — shu tugma yoki Esc (brauzer toʻliq ekrandan chiqsa, rejim
   ham tugaydi). Yon panel AVVALGI holatiga qaytadi; sahifadan ketilsa
   ham hammasi tiklanadi.

   Toʻliq ekran rad etilsa (iOS, ruxsat yoʻq) — 2 va 3 baribir ishlaydi.
   ════════════════════════════════════════════════════════════════════ */

const ATTR = "studioFocus";

export function useStudioFocus() {
  const { open, setOpen, isMobile } = useSidebar();
  const [on, setOn] = useState(false);
  const sidebarWasOpen = useRef<boolean | null>(null);
  const wentFullscreen = useRef(false);
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const exit = useCallback(() => {
    delete document.documentElement.dataset[ATTR];
    if (document.fullscreenElement && wentFullscreen.current) {
      document.exitFullscreen().catch(() => {});
    }
    wentFullscreen.current = false;
    if (sidebarWasOpen.current) setOpen(true);
    sidebarWasOpen.current = null;
    setOn(false);
  }, [setOpen]);

  const enter = useCallback(() => {
    document.documentElement.dataset[ATTR] = "";
    if (!isMobile) {
      sidebarWasOpen.current = openRef.current;
      setOpen(false);
    }
    if (document.fullscreenEnabled && !document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          wentFullscreen.current = true;
        })
        .catch(() => {});
    }
    setOn(true);
  }, [isMobile, setOpen]);

  // Esc — brauzer toʻliq ekrandan chiqdi → rejim ham tugaydi.
  useEffect(() => {
    if (!on) return;
    const onChange = () => {
      if (!document.fullscreenElement && wentFullscreen.current) exit();
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, [on, exit]);

  // Sahifadan ketilsa — sarlavha va yon panel qaytsin.
  const exitRef = useRef(exit);
  const onRef = useRef(on);
  useEffect(() => {
    exitRef.current = exit;
    onRef.current = on;
  }, [exit, on]);
  useEffect(
    () => () => {
      if (onRef.current) exitRef.current();
    },
    [],
  );

  const toggle = useCallback(() => (on ? exit() : enter()), [on, enter, exit]);
  return { focus: on, toggleFocus: toggle };
}
