"use client";

import { GraduationCap, Plus, Pencil, Trash2, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { CLASSES, classColor, type ClassData } from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";

type Props = {
  selectedClassId: string;
  onSelect: (id: string) => void;
  /** Grades sahifasi uchun — bo'lmasa barcha sinflar bosiladi */
  classDataMap?: Record<string, ClassData>;
  /** Grades sahifasi uchun */
  classAverage?: number;
  /** Stats panelining pastki 2 ta stat labellarini override qilish */
  statLabels?: [string, string];
  /** Stats panelining 2 ta stat qiymatlarini override qilish */
  statValues?: (cls: ClassData) => [number, number];
  /** classDataMap siz ham stats panelini ko'rsatish uchun (attendance kabi) */
  statsOverride?: { values: [number | string, number | string]; labels: [string, string] };
  /** "Record" yoki "O'rtacha davomat" label */
  averageLabel?: string;
};

export default function ClassListPanel({
  selectedClassId,
  onSelect,
  classDataMap,
  classAverage,
  statLabels = ["O'quvchilar", "Topshiriqlar"],
  statValues = (cd) => [cd.students.length, cd.assignments.length],
  statsOverride,
  averageLabel = "Sinf o'rtachasi",
}: Props) {
  const selected = CLASSES.find((c) => c.id === selectedClassId);
  const selectedData = classDataMap?.[selectedClassId];
  const hex = selected ? CLASS_COLOR_HEX[classColor(selected)] : undefined;
  const showStats = !!(selected && hex && (selectedData || statsOverride));

  return (
    <div className="min-w-0 min-h-0 pr-4">
      <div className="h-full grid">
        <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col overflow-hidden min-w-0 min-h-0 h-full">
          {/* Header */}
          <div className="px-5 pt-5 pb-3 flex items-center justify-between shrink-0 gap-3 min-h-[4.5rem]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-muted">
                <GraduationCap className="size-5 text-foreground" aria-hidden="true" />
              </div>
              <h2 className="heading-section">Barcha sinflar</h2>
            </div>
            <button className="size-11 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <Plus className="size-5" aria-hidden="true" />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 min-h-0 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card to-transparent z-10 pointer-events-none" />
            <div className="h-full overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="px-5 pt-1 pb-5 space-y-1">
                {CLASSES.map((cls) => {
                  const isSelected = cls.id === selectedClassId;
                  const hasData = classDataMap
                    ? !!classDataMap[cls.id] || cls.id === "no-class"
                    : cls.id !== "no-class";
                  const colorHex = CLASS_COLOR_HEX[classColor(cls)];

                  if (isSelected) {
                    return (
                      <button
                        key={cls.id}
                        onClick={() => onSelect(cls.id)}
                        className="w-full flex items-center text-left gap-3 p-4 border-2 rounded-xl cursor-pointer animate-spring-bounce"
                        style={{
                          borderColor: colorHex,
                          backgroundColor: `color-mix(in srgb, ${colorHex} 6.3%, transparent)`,
                        }}
                      >
                        <div
                          className="p-3.5 rounded-xl shrink-0"
                          style={{ backgroundColor: `color-mix(in srgb, ${colorHex} 12.5%, transparent)` }}
                        >
                          <GraduationCap
                            className="size-7"
                            aria-hidden="true"
                            style={{ color: colorHex }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="heading-small leading-tight truncate block">{cls.name}</span>
                          {cls.time && (
                            <span className="text-xs text-muted-foreground/60 mt-0.5 block truncate">
                              {cls.time}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  }

                  return (
                    <button
                      key={cls.id}
                      onClick={() => hasData && onSelect(cls.id)}
                      disabled={!hasData}
                      className="group w-full flex items-center text-left gap-2.5 px-3 py-2 border-2 border-transparent rounded-lg cursor-pointer transition-transform duration-200 ease-out hover:translate-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0"
                    >
                      <div
                        className="size-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: hasData ? colorHex : undefined }}
                      />
                      <span className="text-sm text-foreground/70 truncate flex-1 transition-all duration-200 ease-out group-hover:text-foreground group-hover:font-semibold">
                        {cls.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stats panel */}
          {showStats && (
            <div className="group/stats border-t border-border px-5 py-5 space-y-4 shrink-0">
              <div className="flex items-center gap-3">
                <Link
                  href={`/dashboard/classes/${selected!.id}`}
                  className="relative group/icon p-3.5 rounded-xl shrink-0 block overflow-hidden"
                  style={{ backgroundColor: `color-mix(in srgb, ${hex} 12.5%, transparent)` }}
                >
                  <span
                    className="absolute inset-0 rounded-xl opacity-0 group-hover/icon:opacity-100 transition-opacity duration-200"
                    style={{ backgroundColor: hex }}
                  />
                  <GraduationCap
                    className="relative size-7 transition-opacity duration-200 group-hover/icon:opacity-0"
                    aria-hidden="true"
                    style={{ color: hex }}
                  />
                  <ArrowUpRight
                    className="size-7 absolute inset-0 m-auto opacity-0 transition-opacity duration-200 group-hover/icon:opacity-100 text-white"
                    aria-hidden="true"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <h4 className="heading-small leading-tight truncate">{selected!.name}</h4>
                  {selected!.time && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1 leading-relaxed">
                      {selected!.time}
                    </p>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover/stats:opacity-100 transition-opacity duration-200">
                  <button className="p-2 rounded-lg text-muted-foreground/40 hover:text-primary hover:bg-muted transition-colors">
                    <Pencil className="size-4" aria-hidden="true" />
                  </button>
                  <button className="p-2 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-muted transition-colors">
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="gap-2 text-center grid grid-cols-2">
                {(statsOverride
                  ? statsOverride.values
                  : statValues(selectedData!)
                ).map((val, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `color-mix(in srgb, ${hex} 8.2%, transparent)` }}
                  >
                    <p className="text-lg font-bold">{val}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {statsOverride ? statsOverride.labels[i] : statLabels[i]}
                    </p>
                  </div>
                ))}
              </div>

              {classAverage !== undefined && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{averageLabel}</span>
                    <span className="font-medium">{Math.round(classAverage)}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(classAverage, 100)}%`, backgroundColor: hex }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
