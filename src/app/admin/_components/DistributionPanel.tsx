import { ChartPie } from "lucide-react";
import { Panel, PanelBody } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import { AdminPanelHeader } from "./AdminPanelHeader";

/* Tarif va qurilma taqsimoti — bitta panelda, ikkalasi bir qarashda.

   Ilgari ikkita alohida karta edi, tarif esa faqat «pro 3» kabi
   badge + son bilan chizilardi — ulushni bosh hisobda chiqarish
   kerak edi. Endi har taqsimot bitta segmentli chiziq + legenda:
   nechta va necha foiz birga koʻrinadi. */

export type DistributionItem = { key: string; label: string; value: number };

/* Segment ranglari — grafik tokenlari. Tailwind klassni skanerlab
   topishi uchun toʻliq satrlar (dinamik `bg-chart-${i}` topilmaydi). */
const SEGMENT = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"];

function share(n: number, total: number): number {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

function DistributionBlock({
  title,
  hint,
  items,
}: {
  title: string;
  /** Maxraj nima ekanini aytadi — foizni notoʻgʻri oʻqimaslik uchun. */
  hint: string;
  items: DistributionItem[];
}) {
  const total = items.reduce((n, i) => n + i.value, 0);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-medium">{title}</h3>
        <span className="text-caption text-muted-foreground">{hint}</span>
      </div>
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">Maʼlumot yoʻq</p>
      ) : (
        <>
          {/* Segmentlar orasidagi 2px oraliq — qoʻshni ranglar bir-biriga
              qoʻshilib ketmasin. Kenglik `width: X%` EMAS, `flex-grow`:
              foizlar yigʻindisi 100% boʻlib, ustiga oraliqlar qoʻshilsa
              oxirgi segment kesilib qolardi. */}
          <div className="flex h-2 gap-0.5 overflow-hidden rounded-full" aria-hidden>
            {items.map((item, i) =>
              item.value > 0 ? (
                <div
                  key={item.key}
                  className={cn("min-w-1 basis-0", SEGMENT[i % SEGMENT.length])}
                  style={{ flexGrow: item.value }}
                />
              ) : null,
            )}
          </div>
          <ul className="flex flex-col gap-2">
            {items.map((item, i) => (
              <li key={item.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className={cn("size-2 shrink-0 rounded-full", SEGMENT[i % SEGMENT.length])} />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {item.value}
                  <span className="ml-2 font-normal text-muted-foreground">
                    {share(item.value, total)}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

export function DistributionPanel({
  plans,
  devices,
}: {
  plans: DistributionItem[];
  devices: DistributionItem[];
}) {
  return (
    <Panel>
      <AdminPanelHeader icon={<ChartPie />} title="Taqsimotlar" />
      <PanelBody inset className="flex flex-col gap-6">
        <DistributionBlock title="Tarif" hint="oʻqituvchilar boʻyicha" items={plans} />
        {/* ⚠️ Maxraj — SEANS, foydalanuvchi emas (getDeviceBreakdown izohi).
            Izohda shu ataylab yozilgan: «foydalanuvchilarning 40% mobil»
            deb oʻqilib qolmasin. */}
        <DistributionBlock title="Qurilma" hint="oxirgi 30 kun seanslari" items={devices} />
      </PanelBody>
    </Panel>
  );
}
