"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { FileCheck2, Presentation } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AssignmentType = "test" | "deck";

/**
 * "Yaratish" tanlagichi — Wayground `Create` menyusi naqshi (R144), V1 uchun
 * ikkiga qisqartirilgan: Test va Taqdimot. Sinf ALLAQACHON chap paneldan
 * tanlangan boʻlgani uchun bu yerda qayta soʻralmaydi — faqat tur tanlanadi.
 */
export default function AssignmentTypePicker({
  open,
  onOpenChange,
  classId,
  className,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: string;
  className: string;
  onCreate: (input: { classId: string; kind: AssignmentType }) => void;
}) {
  const t = useTranslations("AssignmentsPage");
  const [kind, setKind] = useState<AssignmentType>("test");

  const options: { kind: AssignmentType; icon: typeof FileCheck2; title: string; desc: string }[] = [
    { kind: "test", icon: FileCheck2, title: t("kindTest"), desc: t("kindTestDesc") },
    { kind: "deck", icon: Presentation, title: t("kindDeck"), desc: t("kindDeckDesc") },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("createButton")}</DialogTitle>
          <DialogDescription>{t("pickerDescriptionForClass", { className })}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          {options.map((o) => (
            <button
              key={o.kind}
              type="button"
              onClick={() => setKind(o.kind)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors",
                kind === o.kind
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted"
              )}
            >
              <o.icon className={cn("size-5", kind === o.kind ? "text-primary" : "text-muted-foreground")} />
              <span className="text-sm font-semibold text-foreground">{o.title}</span>
              <span className="text-xs text-muted-foreground leading-snug">{o.desc}</span>
            </button>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={() => onCreate({ classId, kind })}>
            {t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
