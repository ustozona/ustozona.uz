"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { useInkTool } from "@/lib/doska/ink-tool";
import { BarButton } from "./BarButton";
import { IconCursor, IconEraser, IconPen } from "./icons";

/* ════════════════════════════════════════════════════════════════════
   REJIM ALMASHTIRGICH — Qalam · Oʻchirgʻich · Tanlash.

   Uch yorliqli tugma, bittasi bosilgan. Vidjet paneli (`WidgetBar`) va
   yon relsalar (`EdgeRail`) shu bitta komponentni ishlatadi, shuning
   uchun rejim har joyda bir xil koʻrinadi va bir xil ishlaydi.

   Yorliq va 52 px plitka — vidjet tugmalari bilan bir daraja: yozish
   doskaning asosiy vazifasi, uning tugmasi vidjetdan kichik boʻlmasligi
   kerak. Bosilgani joriy rejimdan oʻqiladi (`useInkTool`): qoʻlyozma
   paneli ochiq boʻlsa, qalam yoki oʻchirgʻich yonib turadi.
   ════════════════════════════════════════════════════════════════════ */
export function ModeSwitch({ vertical }: { vertical: boolean }) {
  const t = useTranslations("Doska.ink");
  const mode = useInkTool((s) => s.mode);
  const setMode = useInkTool((s) => s.setMode);

  const pen = mode === "pen" || mode === "marker";
  const eraser = mode === "eraser";
  const select = mode === null;
  const cls = "aria-pressed:bg-[var(--doska-ctl-active)] w-20";

  return (
    <div role="group" aria-label={t("toolbar")} className={cn("flex shrink-0 gap-0.5 p-1", vertical && "flex-col")}>
      <BarButton
        label={t("pen")}
        Icon={IconPen}
        active={pen}
        aria-pressed={pen}
        onClick={() => setMode(useInkTool.getState().lastTool)}
        className={cls}
      />
      <BarButton
        label={t("eraser")}
        Icon={IconEraser}
        active={eraser}
        aria-pressed={eraser}
        onClick={() => setMode("eraser")}
        className={cls}
      />
      <BarButton
        label={t("select")}
        Icon={IconCursor}
        active={select}
        aria-pressed={select}
        onClick={() => setMode(null)}
        className={cls}
      />
    </div>
  );
}
