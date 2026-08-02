"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";

/** Toʻliq ekranli muharrirlarning oʻng panellari (Tafsilotlar/AI) uchun umumiy
 *  header — loyihaning Panel tili (68px, SectionIcon, CardTitle) bilan mos.
 *  Dars muharriri ham, topshiriq muharriri ham shuni ishlatadi. */
export function EditorSidePanelHeader({
  icon,
  title,
  actions,
  onClose,
  closeLabel,
}: {
  icon: React.ReactNode;
  title: React.ReactNode;
  actions?: React.ReactNode;
  onClose: () => void;
  closeLabel: string;
}) {
  return (
    <div className="grid min-h-16 shrink-0 grid-cols-[1fr_auto] items-center gap-3 border-b border-border px-5 py-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <SectionIcon className="shrink-0">{icon}</SectionIcon>
        <CardTitle className="truncate">{title}</CardTitle>
      </div>
      <div className="flex items-center gap-1">
        {actions}
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={closeLabel}>
          <X className="size-4.5" />
        </Button>
      </div>
    </div>
  );
}
