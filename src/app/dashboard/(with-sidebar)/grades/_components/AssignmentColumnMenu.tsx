"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Send, UserX, ListPlus } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Topshiriq ustuni sarlavhasining oʻng-tugma menyusi — ommaviy amallar
 * (baholanmaganlarni toʻldirish, qolganlarni “T” deb belgilash, qoralamalarni
 * nashr qilish). Ilgari bular hover-kartada edi; karta endi faqat maʼlumot
 * koʻrsatadi, amallar shu yerga koʻchdi.
 */
export default function AssignmentColumnMenu({
  maxScore,
  draftCount,
  ungradedCount,
  onFillColumn,
  onMarkRemaining,
  onPublish,
  children,
}: {
  maxScore: number;
  draftCount: number;
  ungradedCount: number;
  onFillColumn: (score: number) => void;
  onMarkRemaining: () => void;
  onPublish: () => void;
  children: ReactNode;
}) {
  const t = useTranslations("AssignmentTooltip");
  const [fillOpen, setFillOpen] = useState(false);
  const [fillVal, setFillVal] = useState("");

  const hasUngraded = ungradedCount > 0;
  const hasDrafts = draftCount > 0;
  // Amal yoʻq boʻlsa boʻsh menyu ochilmasin — sarlavha oddiy holida qoladi.
  if (!hasUngraded && !hasDrafts) return <>{children}</>;

  function applyFill() {
    const n = Number(fillVal.trim());
    if (fillVal.trim() === "" || Number.isNaN(n)) return;
    onFillColumn(Math.max(0, Math.min(maxScore, n)));
    setFillVal("");
    setFillOpen(false);
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="h-full w-full">{children}</div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-60">
          {hasUngraded && (
            <>
              <ContextMenuItem className="gap-2" onSelect={() => setFillOpen(true)}>
                <ListPlus className="size-4" />
                {t("fillColumn")}
              </ContextMenuItem>
              <ContextMenuItem className="gap-2" onSelect={onMarkRemaining}>
                <UserX className="size-4" />
                {t("markRemaining")}
              </ContextMenuItem>
            </>
          )}
          {hasUngraded && hasDrafts && <ContextMenuSeparator />}
          {hasDrafts && (
            <ContextMenuItem className="gap-2" onSelect={onPublish}>
              <Send className="size-4" />
              {t("publishDrafts", { count: draftCount })}
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <Dialog open={fillOpen} onOpenChange={setFillOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("fillColumn")}</DialogTitle>
            <DialogDescription>
              {t("fillDialogDescription", { count: ungradedCount })}
            </DialogDescription>
          </DialogHeader>
          <Input
            type="number"
            autoFocus
            value={fillVal}
            onChange={(e) => setFillVal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFill()}
            placeholder={`0–${maxScore}`}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFillOpen(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={applyFill}>{t("apply")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
