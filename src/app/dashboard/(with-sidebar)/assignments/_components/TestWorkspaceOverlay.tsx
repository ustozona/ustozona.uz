"use client";

import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { X, FileCheck2 } from "lucide-react";
import { SectionIcon } from "@/components/ui/section-icon";
import BaholashView from "./test/BaholashView";

/**
 * Test (Baholash) ish maydoni — Topshiriqlar oqimi ichida toʻliq ekran
 * overlay sifatida ochiladi (alohida "/dashboard/baholash" sahifasi va
 * sidebar bandi endi yoʻq — hammasi shu yerda, AssignmentEditorOverlay
 * ustiga qoʻyiladi).
 */
export default function TestWorkspaceOverlay({
  classId,
  className,
  autoOpenNewSet,
  autoOpenSetId,
  autoOpenTitle,
  onClose,
}: {
  classId: string;
  className: string;
  autoOpenNewSet?: boolean;
  autoOpenSetId?: string;
  /** Yangi testning boshlangʻich nomi — topshiriq nomi bilan bir xil. */
  autoOpenTitle?: string;
  onClose: () => void;
}) {
  const t = useTranslations("AssignmentsPage");

  return createPortal(
    <div className="fixed inset-0 z-[45] flex flex-col bg-card animate-in fade-in-0 duration-fast">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <SectionIcon>
            <FileCheck2 />
          </SectionIcon>
          <h1 className="min-w-0 truncate text-lg font-semibold text-foreground">
            {t("kindTest")} — {className}
          </h1>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
          <span className="sr-only">{t("close")}</span>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <BaholashView
          classId={classId}
          className={className}
          autoOpenNewSet={autoOpenNewSet}
          autoOpenSetId={autoOpenSetId}
          autoOpenTitle={autoOpenTitle}
        />
      </div>
    </div>,
    document.body
  );
}
