"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, CheckSquare } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import AttendanceStatusesEditor from "@/components/attendance/AttendanceStatusesEditor";
import SettingsDialogContent from "@/components/settings/SettingsDialogContent";
import { SaveFooter, useDraft } from "@/app/dashboard/settings/_components/SettingsShared";

/* Davomat sozlamalari modali — sahifadan chiqmasdan statuslar/vaznlarni
   tahrirlash. Muharrir Sozlamalar > Davomat bilan bir xil komponent
   (AttendanceStatusesEditor); saqlash explicit (SaveFooter). */

function ModalBody() {
  const statuses = useAttendanceStore((s) => s.statuses);
  const setStatuses = useAttendanceStore((s) => s.setStatuses);
  const { draft, setDraft, dirty, save, reset } = useDraft(statuses, setStatuses);

  return (
    <SettingsDialogContent
      icon={CheckSquare}
      title="Davomat sozlamalari"
      description="Statuslar va davomat foiziga taʼsiri"
      footer={<SaveFooter dirty={dirty} onSave={save} onReset={reset} />}
    >
      <div className="space-y-4">
        <AttendanceStatusesEditor value={draft} onChange={setDraft} />
        <Link
          href="/dashboard/settings?section=davomat"
          className="inline-flex items-center gap-1 text-caption text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Barcha sozlamalar
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>
    </SettingsDialogContent>
  );
}

export default function AttendanceSettingsModal({ trigger }: { trigger: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <ModalBody />
    </Dialog>
  );
}
