"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from "@tiptap/react";
import { Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CALLOUT_TYPES, CALLOUT_META } from "./callout-extension";
import { normalizeCalloutType } from "./callout-types";
import { cn } from "@/lib/utils";

/**
 * Callout NodeView — chap rangli hoshiya + ikon va toʻliq tahrirlanadigan
 * ichki kontent (sarlavha qatori + tana).
 *
 * Ikon endi BOSILADIGAN: 11 turdan istalganini tanlash mumkin — ilgari
 * turini oʻzgartirish uchun butun blokni oʻchirib qayta yaratish kerak
 * edi (matnni koʻchirib, yangi blok qoʻyib, qayta joylashtirib). Naqsh
 * NotionCalloutView bilan bir xil — ikkala callout tizimi izchil boshqariladi.
 *
 * Rang FAQAT shu yerda hisoblanadi (`--cl` inline style) — globals.css bu
 * qiymatni qayta yozmaydi (ikki manba ajralib ketish xavfi yoʻqolgan).
 */
export default function CalloutView({ node, updateAttributes }: NodeViewProps) {
  const t = useTranslations("LessonEditorToolbar");
  const type = normalizeCalloutType(node.attrs.type as string);
  const meta = CALLOUT_META[type];
  const Icon = meta.icon;
  const [typeOpen, setTypeOpen] = useState(false);

  return (
    <NodeViewWrapper
      className="callout"
      data-callout-type={type}
      style={{ "--cl": meta.color } as React.CSSProperties}
    >
      <Popover open={typeOpen} onOpenChange={setTypeOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            contentEditable={false}
            className="callout-icon callout-icon-btn"
            title={t("changeCalloutType")}
          >
            <Icon aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-1 max-h-[320px] overflow-y-auto">
          {CALLOUT_TYPES.map(({ type: optType, icon: OptIcon, color: optColor }) => (
            <button
              key={optType}
              type="button"
              onClick={() => {
                updateAttributes({ type: optType });
                setTypeOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm text-left",
                "hover:bg-accent hover:text-accent-foreground transition-colors"
              )}
            >
              <OptIcon className="size-4 shrink-0" style={{ color: optColor }} />
              <span className="flex-1">{t(`calloutTypes.${optType}`)}</span>
              {optType === type && <Check className="size-4 shrink-0" />}
            </button>
          ))}
        </PopoverContent>
      </Popover>
      <NodeViewContent className="callout-inner" />
    </NodeViewWrapper>
  );
}
