"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useAttendanceStore } from "@/store/useAttendanceStore";
import { IMPACT_LABELS, IMPACT_WEIGHT, type ScoreImpact } from "@/lib/attendance-data";
import AttendanceStatusesEditor, {
  IMPACT_SIGN_CLS,
  SignIcon,
} from "@/components/attendance/AttendanceStatusesEditor";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SaveFooter, SettingsCard, useDraft, useRegisterDraft } from "./SettingsShared";

/** Vazn legendasi — har variant foizga qanday taʼsir qilishini tushuntiradi. */
const IMPACT_LEGEND: { impact: ScoreImpact; text: string }[] = [
  { impact: "full", text: "Davomat foiziga toʻliq qoʻshiladi" },
  { impact: "half", text: "Yarim dars sifatida qoʻshiladi" },
  { impact: "none", text: "Davomat foizini kamaytiradi" },
  { impact: "excluded", text: "Umumiy foizga taʼsir qilmaydi (hisobdan chiqariladi)" },
];

export default function AttendanceSection() {
  const statuses = useAttendanceStore((s) => s.statuses);
  const setStatuses = useAttendanceStore((s) => s.setStatuses);
  const { draft, setDraft, dirty, save, reset } = useDraft(statuses, setStatuses);
  useRegisterDraft("davomat-statuslar", dirty, save, reset);

  return (
    <>
      <SettingsCard
        title="Davomat statuslari"
        description="Statuslarni faollashtiring yoki oʻchiring hamda vaznini belgilang. Oʻzgarishlar barcha davomat hisobotlarida aks etadi."
        footer={<SaveFooter dirty={dirty} onSave={save} onReset={reset} />}
      >
        <AttendanceStatusesEditor value={draft} onChange={setDraft} />
      </SettingsCard>

      <SettingsCard
        title="Davomat foizi"
        description="Har bir status oʻquvchining umumiy davomat foiziga turlicha taʼsir qiladi."
      >
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-32 px-4">Taʼsir</TableHead>
                <TableHead className="w-16 text-center">Vazn</TableHead>
                <TableHead className="px-4">Izoh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {IMPACT_LEGEND.map((l) => {
                const w = IMPACT_WEIGHT[l.impact];
                return (
                  <TableRow key={l.impact} className="bg-card hover:bg-card">
                    <TableCell className="px-4 py-2.5">
                      <span className="flex items-center gap-2.5">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                          <SignIcon
                            impact={l.impact}
                            className={cn("size-3.5", IMPACT_SIGN_CLS[l.impact])}
                          />
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {IMPACT_LABELS[l.impact]}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="px-2 py-2.5 text-center text-sm font-semibold tabular-nums text-foreground">
                      {w == null ? "—" : `×${w}`}
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-caption">{l.text}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <p className="text-caption">
          Eslatma: belgilanmagan (boʻsh qoldirilgan) kunlar umumiy hisobga taʼsir qilmaydi.
        </p>
      </SettingsCard>
    </>
  );
}
