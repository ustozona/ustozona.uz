"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Award } from "lucide-react";
import { useTranslations } from "next-intl";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import { useAutoRuleTiles, weekExample } from "@/components/behavior/AutoPointsEditor";
import SettingsDialogContent from "@/components/settings/SettingsDialogContent";
import { SaveFooter, useDraft } from "@/app/dashboard/settings/_components/SettingsShared";
import { cn } from "@/lib/utils";

/* Xulq sozlamalari modali — sahifadan chiqmasdan avto-ball qoidalarini
   tahrirlash. Kartalar Koʻnikmalar sahifasidagi bilan bir xil vizual til
   (useAutoRuleTiles); saqlash explicit (SaveFooter). Koʻnikma/mukofot
   CRUD Sozlamalar sahifasida qoladi. */

const GRID_CLASS = "grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-3";

function ModalBody() {
  const t = useTranslations("BehaviorSettingsModal");
  const autoSettings = useBehaviorStore((s) => s.autoSettings);
  const setAutoSettings = useBehaviorStore((s) => s.setAutoSettings);
  const { draft, setDraft, dirty, save, reset } = useDraft(autoSettings, setAutoSettings);
  const { positive, negative } = useAutoRuleTiles(draft, setDraft);
  const tAuto = useTranslations("AutoPointsEditor");
  const example = weekExample(draft, tAuto);

  return (
    <SettingsDialogContent
      icon={Award}
      title={t("title")}
      description={t("description")}
      footer={<SaveFooter dirty={dirty} onSave={save} onReset={reset} />}
    >
      <div className="space-y-4">
        <div className={GRID_CLASS}>
          {positive}
          {negative}
        </div>
        {example && (
          <p className="text-caption leading-relaxed">
            <span className="font-medium text-foreground">{t("example")}</span>{" "}
            {example.parts.join(" + ")} ={" "}
            <span
              className={cn(
                "font-semibold tabular-nums",
                example.total >= 0 ? "text-success" : "text-destructive"
              )}
            >
              {example.total > 0 ? `+${example.total}` : example.total} {t("point")}
            </span>
          </p>
        )}
        <Link
          href="/dashboard/settings?section=xulq"
          className="inline-flex items-center gap-1 text-caption text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          {t("allSettings")}
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </SettingsDialogContent>
  );
}

export default function BehaviorSettingsModal({ trigger }: { trigger: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <ModalBody />
    </Dialog>
  );
}
