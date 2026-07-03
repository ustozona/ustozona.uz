"use client";

import { GraduationCap, Plus, Pencil, Trash2, ArrowUpRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionIcon } from "@/components/ui/section-icon";
import { CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CLASSES, classColor } from "@/lib/grades-data";
import { CLASS_COLOR_HEX, classColorStyle, classTints } from "@/lib/class-colors";
import { useClassPanelStats, type Page } from "@/hooks/useClassPanelStats";

type Props = {
  page: Page;
  selectedClassId: string;
  onSelect: (id: string) => void;
  onAddClass?: () => void;
  onEditClass?: (id: string) => void;
  onDeleteClass?: (id: string) => void;
};

export default function ClassListPanel({
  page,
  selectedClassId,
  onSelect,
  onAddClass,
  onEditClass,
  onDeleteClass,
}: Props) {
  const selected = CLASSES.find((c) => c.id === selectedClassId);
  const hex = selected ? CLASS_COLOR_HEX[classColor(selected)] : undefined;
  /** Sinf rangidan shaffof tint (EMStudio rgba(...) effekti) */
  const tint = (h: string, pct: number) => `color-mix(in srgb, ${h} ${pct}%, transparent)`;

  const stats = useClassPanelStats(page, selectedClassId);
  const showStats = !!(selected && hex && stats);

  return (
    <div className="h-full flex flex-col">
      <div className="bg-card rounded-xl card-elevation flex flex-col overflow-hidden min-w-0 min-h-0 h-full">
        {/* Header */}
        <div className="flex min-h-[4.5rem] items-center justify-between shrink-0 gap-3 border-b border-border px-5 py-5">
          <div className="flex items-center gap-2 min-w-0">
            <SectionIcon><GraduationCap /></SectionIcon>
            <CardTitle className="truncate">Sinflar</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onAddClass}
            className="shrink-0 gap-1.5 text-muted-foreground hover:text-foreground"
            aria-label="Sinf qoʻshish"
          >
            <Plus className="size-4" aria-hidden="true" />
            Qoʻshish
          </Button>
        </div>

        {/* List */}
        <div className="flex-1 min-h-0 relative overflow-hidden">
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />
          <ScrollArea className="h-full w-full">
            <div className="px-5 pt-4 pb-5 space-y-0.5">
              {CLASSES.map((cls) => {
                const isSelected = cls.id === selectedClassId;
                const color = classColor(cls);
                const tints = classTints(color);

                // Active: ikonkali, balandroq, rangli border. Default: ixcham qator.
                // Ikkalasi ham bitta rang tizimidan (classTints) — magic foiz yoʻq.
                if (isSelected) {
                  return (
                    <button
                      key={cls.id}
                      onClick={() => onSelect(cls.id)}
                      style={{ ...classColorStyle(color), ...tints.surface, borderColor: tints.solid }}
                      className="w-full flex items-center text-left gap-3 p-4 min-h-20 rounded-xl border-2 cursor-pointer"
                      aria-current="true"
                    >
                      <div className="size-12 rounded-lg shrink-0 flex items-center justify-center" style={tints.iconBg}>
                        <GraduationCap className="size-6" style={{ color: tints.solid }} aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-foreground leading-tight truncate block">{cls.name}</span>
                        {cls.time && (
                          <span className="text-xs text-muted-foreground mt-0.5 block truncate">{cls.time}</span>
                        )}
                      </div>
                    </button>
                  );
                }

                return (
                  <button
                    key={cls.id}
                    onClick={() => onSelect(cls.id)}
                    style={classColorStyle(color)}
                    className="group w-full flex items-center text-left gap-3 px-3 py-2.5 min-h-12 rounded-lg border-2 border-transparent cursor-pointer transition-colors hover:bg-muted/50"
                  >
                    <span className="size-3 rounded-[4px] shrink-0" style={tints.dot} />
                    <span className="text-sm text-foreground/70 truncate flex-1 transition-colors group-hover:text-foreground">
                      {cls.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Stats footer */}
        {showStats && (
          <div className="group/stats border-t border-border px-5 py-5 space-y-4 shrink-0">
            <div className="flex items-center gap-3">
              <Link
                href={`/dashboard/classes/${selected!.id}`}
                title="Sinfni ochish"
                className="relative group/icon p-3.5 rounded-xl shrink-0 block overflow-hidden"
                style={{ backgroundColor: tint(hex!, 12.5) }}
              >
                <span
                  className="absolute inset-0 rounded-xl opacity-0 group-hover/icon:opacity-100 transition-opacity duration-200"
                  style={{ backgroundColor: hex }}
                />
                <GraduationCap
                  className="relative size-7 transition-opacity duration-200 group-hover/icon:opacity-0"
                  style={{ color: hex }}
                  aria-hidden="true"
                />
                <ArrowUpRight
                  className="size-7 absolute inset-0 m-auto opacity-0 transition-opacity duration-200 group-hover/icon:opacity-100 text-white"
                  aria-hidden="true"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-foreground leading-tight truncate">{selected!.name}</h4>
                {selected!.time && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1 leading-relaxed">{selected!.time}</p>
                )}
              </div>
              <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover/stats:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => onEditClass?.(selected!.id)}
                  title="Tahrirlash"
                  className="p-2 rounded-lg text-muted-foreground/40 hover:text-primary hover:bg-muted transition-colors"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </button>
                <button
                  onClick={() => onDeleteClass?.(selected!.id)}
                  title="Oʻchirish"
                  className="p-2 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-muted transition-colors"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div
              className="gap-2 text-center grid"
              style={{ gridTemplateColumns: `repeat(${stats!.items.length}, minmax(0, 1fr))` }}
            >
              {stats!.items.map((item, i) => (
                <div key={i} className="p-2 rounded-lg" style={{ backgroundColor: tint(hex!, 8.2) }}>
                  <p className="text-base font-bold text-foreground leading-none">{item.value}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">{item.label}</p>
                </div>
              ))}
            </div>

            {stats!.progress && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{stats!.progress.label}</span>
                  <span className="font-medium tabular-nums">{Math.round(stats!.progress.value)}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(stats!.progress.value, 100)}%`, backgroundColor: hex }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
