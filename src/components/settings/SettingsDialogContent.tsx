"use client";

import * as React from "react";
import { X, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Sozlamalar modallarining umumiy qobigʻi (GradesSettingsModal anatomiyasi):
 * SectionIcon header + scroll body + ixtiyoriy footer (odatda SaveFooter).
 * Dialog/DialogTrigger tashqarida qoladi — bu faqat content.
 */
export default function SettingsDialogContent({
  icon: Icon,
  title,
  description,
  children,
  footer,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const t = useTranslations("SettingsDialogContent");
  return (
    <DialogContent
      showCloseButton={false}
      className={cn("max-w-md gap-0 overflow-hidden p-0 bg-card", className)}
    >
      {/* Standart header — ikona + sarlavha + size-9 yopish tugmasi */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <SectionIcon>
            <Icon />
          </SectionIcon>
          <div className="flex flex-col">
            <DialogTitle asChild>
              <CardTitle>{title}</CardTitle>
            </DialogTitle>
            <DialogDescription className="text-caption">{description}</DialogDescription>
          </div>
        </div>
        <DialogClose className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          <X className="size-4" />
          <span className="sr-only">{t("close")}</span>
        </DialogClose>
      </div>

      <div className="flex max-h-[70vh] flex-col gap-6 overflow-y-auto scrollbar-thin p-6">
        {children}
      </div>

      {footer && (
        <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/20 px-6 py-3">
          {footer}
        </div>
      )}
    </DialogContent>
  );
}
