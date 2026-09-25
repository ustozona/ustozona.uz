"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import { useDoskaStore } from "@/lib/doska/store";
import { Z_CURTAIN } from "@/lib/doska/layers";
import { IconCurtain } from "./icons";

/**
 * PARDA — butun ekran yopiladi, sinf doskaga emas, oʻqituvchiga qaraydi
 * (docs/doska-ux-tadqiqot.md R313). `1` tugmasi yoki menyu.
 *
 * Mazmun koʻrinmaydi, lekin oʻchirilmaydi: parda koʻtarilgach hamma narsa
 * joyida, taymer ham ishlashda davom etadi.
 *
 * Istalgan tugma yoki bosish pardani koʻtaradi. Tugma bosilishi Doskaning
 * boshqa yorliqlariga YETIB BORMAYDI (`capture` + `stopImmediatePropagation`):
 * aks holda pardani `Delete` bilan koʻtargan oʻqituvchi tanlangan vidjetni
 * ham oʻchirib yuborardi.
 */
export function DoskaCurtain() {
  const on = useDoskaStore((s) => s.curtain);
  const setCurtain = useDoskaStore((s) => s.setCurtain);
  const t = useTranslations("Doska.curtain");

  React.useEffect(() => {
    if (!on) return;
    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      // Pardani ochgan `1` biroz uzoq bosilsa, takroriy keydown uni darhol
      // yopib yuborardi — sinf faqat bir chaqnashni koʻrardi.
      if (e.repeat) return;
      setCurtain(false);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [on, setCurtain]);

  if (!on) return null;

  return (
    <div
      role="dialog"
      aria-label={t("title")}
      // `onClick`, `onPointerDown` EMAS: pointerdownʼda parda yoʻqolsa,
      // xuddi shu bosishning `click` hodisasi ostidagi vidjetga tushadi —
      // pardani koʻtargan bosish taymerni ham boshlab yuborardi.
      onClick={() => setCurtain(false)}
      className="fixed inset-0 flex cursor-pointer flex-col items-center justify-center gap-4 bg-[oklch(0.18_0.02_250/0.78)] text-white backdrop-blur-2xl"
      style={{ zIndex: Z_CURTAIN }}
    >
      <IconCurtain className="size-16 opacity-80" />
      <p className="text-center font-semibold" style={{ fontSize: "clamp(2.5rem, 8vw, 8rem)" }}>
        {t("title")}
      </p>
      <p className="text-base opacity-70">{t("hint")}</p>
    </div>
  );
}
