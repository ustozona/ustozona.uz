import { Filter } from "lucide-react";
import { Panel, PanelBody, PanelFooter } from "@/components/ui/panel";
import type { ActivationFunnel } from "@/server/dal/admin/stats";
import { AdminPanelHeader } from "./AdminPanelHeader";
import { ShareRow } from "./ShareRow";

/* Faollashuv voronkasi — bitta panelda, bosqichlar ketma-ket.

   Ilgari oltita alohida karta edi: har biri oʻz foizini koʻrsatardi,
   lekin qaysi bosqichda odam koʻp tushib qolayotgani kartalar orasida
   yoʻqolardi. Endi chiziqlar ustma-ust turadi va pasayish koʻz bilan
   koʻrinadi.

   ⚠️ BOSQICHDAN BOSQICHGA KONVERSIYA YOZILMAYDI. Bosqichlar qatʼiy
   ichma-ich emas (dal/admin/stats.ts): «Faollashgan» — 3+ kun ishlagan
   HAR KIM, oʻquvchi kiritmagan boʻlsa ham; «Oʻquvchi kiritgan» esa
   arxivlangan sinfdagi bolani ham sanaydi. Shuning uchun «oldingi
   bosqichning X%» degan son yolgʻon boʻlardi. Hammasi bitta maxrajga —
   roʻyxatdan oʻtganlarga — nisbatan. Yagona haqiqiy juftlik:
   «Qaytgan» ⊂ «Faollashgan» — u izohda alohida aytiladi.

   «Shu hafta faol» voronka bosqichi emas (yangi kelgan odam ham
   kiradi), shuning uchun pastki qatorga ajratilgan. */

function pct(n: number, whole: number): number {
  return whole > 0 ? Math.round((n / whole) * 100) : 0;
}

/* Rang chegarasi avvalgi kartalardagi bilan bir xil: 30% dan past —
   xavf, 70% va undan yuqori — yaxshi. */
function barTone(p: number): string | undefined {
  return p < 30 ? "bg-destructive" : p >= 70 ? "bg-success" : undefined;
}

export function FunnelPanel({ funnel }: { funnel: ActivationFunnel }) {
  const base = funnel.signedUp;
  const steps = [
    { label: "Sinf yaratgan", value: funnel.withClass },
    { label: "Oʻquvchi kiritgan", value: funnel.withStudents },
    {
      label: "Faollashgan",
      value: funnel.activated,
      /* «Bitta yozuv bor» EMAS: bir kunda kiritilgan 400 ta davomat —
         ommaviy amal, odat emas. */
      hint: "kamida 3 xil kunda ishlagan",
    },
    {
      label: "Qaytgan",
      value: funnel.returned,
      hint: `roʻyxatdan 7+ kun keyin ham ishlagan · faollashganlarning ${pct(
        funnel.returned,
        funnel.activated,
      )}%`,
    },
  ];

  return (
    <Panel>
      <AdminPanelHeader
        icon={<Filter />}
        title="Faollashuv voronkasi"
        count={`${base} ta`}
        description="Test hisoblarsiz · har bosqich roʻyxatdan oʻtganlarga nisbatan"
      />
      <PanelBody inset className="flex flex-col gap-4">
        <ShareRow
          label="Roʻyxatdan oʻtgan"
          value={base}
          share={base > 0 ? 100 : 0}
          barClassName="bg-muted-foreground/40"
        />
        {steps.map((s) => {
          const share = pct(s.value, base);
          return (
            <ShareRow
              key={s.label}
              label={s.label}
              hint={s.hint}
              value={s.value}
              share={share}
              barClassName={barTone(share)}
            />
          );
        })}
      </PanelBody>
      <PanelFooter className="justify-between gap-3 py-3 text-sm">
        <span>
          Shu hafta faol
          <span className="block text-caption text-muted-foreground">
            oxirgi 7 kunda biror boʻlimda ishlagan
          </span>
        </span>
        <span className="shrink-0 font-medium tabular-nums">
          {funnel.wau}
          <span className="ml-2 font-normal text-muted-foreground">{pct(funnel.wau, base)}%</span>
        </span>
      </PanelFooter>
    </Panel>
  );
}
