import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import ReminderAnimation from "@/components/shadcn-space/blocks/bento-grid-01/ReminderAnimation";
import AnimatedUiBlock from "@/components/shadcn-space/blocks/bento-grid-01/AnimatedUiBlock";
import { CLASS_COLOR_BASE } from "@/lib/class-colors";

// "Standartlar va oʻzlashtirish" kartasi uchun namunaviy qamrov satrlari
// (skrinshot oʻrniga — dizayn-tizimi komponentlaridan yasalgan mini koʻrinish).
const standardSamples: { code: string; pct: number }[] = [
  { code: "R.01", pct: 92 },
  { code: "G.02", pct: 84 },
  { code: "W.01", pct: 68 },
];

// "Sinflar uchun rang tizimi" kartasi — skrinshot oʻrniga real rang
// palitrasidan (class-colors.ts yagona manbasidan) yasalgan namunaviy sinf
// kartalari. Konsepsiyani skrinshotdan koʻra toʻgʻridan-toʻgʻri koʻrsatadi.
const colorSwatchSamples: { label: string; color: keyof typeof CLASS_COLOR_BASE }[] = [
  { label: "9-A", color: "blue" },
  { label: "10-B", color: "teal" },
  { label: "11-V", color: "violet" },
  { label: "8-G", color: "orange" },
];

const Bentogrid = () => {
  return (
    <section>
      <div className="py-11 md:py-20">
        <div className="max-w-7xl xl:px-16 lg:px-8 px-4 mx-auto flex flex-col gap-12">
          <div className="flex flex-col gap-4 items-center justify-center max-w-3xl mx-auto">
            <Badge variant={"outline"} className="px-3 py-1 h-auto text-sm font-normal">
              Tizim afzalliklari
            </Badge>
            <h2 className="text-center md:text-5xl text-3xl mx-auto font-medium">
              Ustozona bilan taʼlimni raqamlashtiring va boshqaruvni osonlashtiring
            </h2>
          </div>
          <div className="grid grid-cols-12 gap-5">
            <div className="lg:col-span-4 col-span-12 overflow-hidden">
              <div className="rounded-xl border border-border">
                <div className="bg-muted rounded-t-xl py-8 px-9 relative">
                  <ReminderAnimation />
                </div>
                <div className="flex flex-col gap-0.5 p-8 border-t border-border">
                  <h3 className="text-xl font-medium text-foreground">
                    Dars jadvali va eslatmalar
                  </h3>
                  <p className="text-base font-normal text-muted-foreground">
                    Dars jadvali va rejalashtiruvchi bir joyda — keyingi darsni, topshiriq muddatini va baholash kunini oʻtkazib yubormaysiz.
                  </p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-8 col-span-12 overflow-hidden">
              <div className="rounded-xl border border-border">
                <div className="bg-muted rounded-t-xl py-7 lg:px-30 px-6 relative">
                  <AnimatedUiBlock />
                </div>
                <div className="flex flex-col gap-0.5 p-8 border-t border-border">
                  <h3 className="text-xl font-medium text-foreground">
                    Yagona boshqaruv paneli
                  </h3>
                  <p className="text-base font-normal text-muted-foreground">
                    Sinflar, oʻzlashtirish va davomat koʻrsatkichlarini bitta oynada kuzating, oʻquv jarayonini real vaqtda tahlil qiling.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 col-span-12 overflow-hidden">
              <div className="rounded-xl border border-border h-full flex flex-col">
                <div className="p-5 bg-muted rounded-t-xl flex-1 flex items-center justify-center overflow-hidden">
                  <div className="w-full max-w-xs flex flex-col gap-2.5">
                    {standardSamples.map((s) => (
                      <div
                        key={s.code}
                        className="rounded-lg border border-border bg-card px-3 py-2.5 flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {s.code}
                          </span>
                          <span
                            className={`text-xs font-medium tabular-nums ${
                              s.pct >= 80 ? "text-success" : "text-warning-foreground"
                            }`}
                          >
                            {s.pct}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${
                              s.pct >= 80 ? "bg-success" : "bg-warning"
                            }`}
                            style={{ width: `${s.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-0.5 p-8 border-t border-border">
                  <h3 className="text-xl font-medium text-foreground">
                    Standartlar va oʻzlashtirish
                  </h3>
                  <p className="text-base font-normal text-muted-foreground">
                    Darslarni davlat taʼlim standartlariga bogʻlang va har bir mavzu boʻyicha oʻzlashtirishni kuzating.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 col-span-12 overflow-hidden">
              <div className="rounded-xl border border-border h-full flex flex-col">
                <div className="p-5 bg-muted rounded-t-xl flex-1 flex items-center justify-center overflow-hidden">
                  <div className="w-full max-w-[210px] rounded-lg border border-border bg-card p-4 shadow-sm flex flex-col gap-2.5">
                    <div className="h-2.5 w-2/3 rounded bg-foreground/80" />
                    <div className="h-1.5 w-full rounded bg-muted-foreground/25" />
                    <div className="h-1.5 w-full rounded bg-muted-foreground/25" />
                    <div className="h-1.5 w-4/5 rounded bg-muted-foreground/25" />
                    <div className="h-1.5 w-full rounded bg-muted-foreground/25" />
                    <div className="h-1.5 w-3/5 rounded bg-muted-foreground/25" />
                    <div className="mt-1.5 flex items-center gap-1.5 self-start rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1">
                      <FileText className="size-3.5 text-destructive" aria-hidden />
                      <span className="text-[11px] font-medium text-destructive">
                        PDF
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-0.5 p-8 border-t border-border">
                  <h3 className="text-xl font-medium text-foreground">
                    Dars muharriri va PDF
                  </h3>
                  <p className="text-base font-normal text-muted-foreground">
                    Darslarni toʻliq ekranli muharrirda tayyorlang va bir bosishda chop etishga tayyor PDF qilib oling.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 col-span-12 overflow-hidden">
              <div className="rounded-xl border border-border h-full flex flex-col">
                <div className="p-5 bg-muted rounded-t-xl flex-1 flex items-center justify-center relative overflow-hidden">
                  <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
                    {colorSwatchSamples.map((sample) => {
                      const c = CLASS_COLOR_BASE[sample.color];
                      return (
                        <div
                          key={sample.label}
                          className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
                          style={{
                            borderColor: `color-mix(in oklch, ${c} 30%, var(--border))`,
                            backgroundColor: `color-mix(in oklch, ${c} 6%, var(--card))`,
                          }}
                        >
                          <span
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: c }}
                          />
                          <span className="text-sm font-medium text-foreground">
                            {sample.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-0.5 p-8 border-t border-border">
                  <h3 className="text-xl font-medium text-foreground">
                    Sinflar uchun rang tizimi
                  </h3>
                  <p className="text-base font-normal text-muted-foreground">
                    Har bir sinf va mavzuga oʻz rangi — jurnal, jadval va hisobotlarda bir qarashda ajratasiz.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Bentogrid;
