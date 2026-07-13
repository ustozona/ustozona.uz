"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Award } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useBehaviorStore } from "@/store/useBehaviorStore";
import AutoPointsEditor from "@/components/behavior/AutoPointsEditor";
import SettingsDialogContent from "@/components/settings/SettingsDialogContent";
import { SaveFooter, useDraft } from "@/app/dashboard/settings/_components/SettingsShared";

/* Xulq sozlamalari modali — sahifadan chiqmasdan avto-ball qoidalarini
   tahrirlash. Muharrir Sozlamalar > Xulq bilan bir xil komponent
   (AutoPointsEditor); saqlash explicit (SaveFooter). Koʻnikma/mukofot
   CRUD Sozlamalar sahifasida qoladi. */

function ModalBody() {
  const autoSettings = useBehaviorStore((s) => s.autoSettings);
  const setAutoSettings = useBehaviorStore((s) => s.setAutoSettings);
  const { draft, setDraft, dirty, save, reset } = useDraft(autoSettings, setAutoSettings);

  return (
    <SettingsDialogContent
      icon={Award}
      title="Xulq sozlamalari"
      description="Davomat va jurnaldan avtomatik ballar"
      footer={<SaveFooter dirty={dirty} onSave={save} onReset={reset} />}
    >
      <div className="space-y-4">
        <AutoPointsEditor value={draft} onChange={setDraft} />
        <Link
          href="/dashboard/settings?section=xulq"
          className="inline-flex items-center gap-1 text-caption text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Barcha sozlamalar (koʻnikmalar va ragʻbat doʻkoni)
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
