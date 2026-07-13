"use client";

import * as React from "react";
import { ArrowRight, GraduationCap, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeaderBar, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useLiveClasses } from "@/hooks/useLiveClasses";
import { useGradesStore } from "@/store/useGradesStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { classColor } from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import {
  bumpClassName,
  defaultRolloverAction,
  GRADUATING_GRADE,
  type RolloverAction,
} from "@/lib/rollover";

/* ════════════════════════════════════════════════════════════════════
   YIL OʻTKAZISH SEHRGARI (ROLLOVER)

   Yangi oʻquv yili yaratilgach ochiladi. Har FAOL sinf uchun uch amal:
   · Koʻchirish — nom/daraja joyida yangilanadi (5-A → 6-A, grade+1);
     sinf UUID va tarixi saqlanadi (davomat/baho oʻzgarmaydi).
   · Saqlash   — oʻzgarmaydi (toʻgarak/darajasiz guruhlar defaulti).
   · Arxivlash — bitiruvchi/tugagan guruh pickerlardan yashirin boʻladi.

   Sehrgar sinflarнигина oʻzgartiradi; yil obyekti (faol yil, jadval
   qamrovi, xulq langarlari) allaqachon yaratish paytida sozlangan.
   ════════════════════════════════════════════════════════════════════ */

type RowState = { action: RolloverAction; newName: string };

export default function RolloverWizard({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const activeClasses = useLiveClasses();
  const setClassDataMap = useGradesStore((s) => s.setClassDataMap);
  const yearLabel = useCalendarStore((s) => s.calendar.yearLabel);

  const [rows, setRows] = React.useState<Record<string, RowState>>({});

  // Modal ochilganda har sinf uchun standart amalni tayyorlaydi.
  React.useEffect(() => {
    if (!open) return;
    const init: Record<string, RowState> = {};
    for (const c of activeClasses) {
      const action = defaultRolloverAction(c);
      init[c.id] = {
        action,
        newName: c.grade != null ? bumpClassName(c.name, c.grade) : c.name,
      };
    }
    setRows(init);
    // activeClasses referensi ochilishда barqaror — faqat `open`ga bogʻlaymiz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setAction = (id: string, action: RolloverAction) =>
    setRows((r) => ({ ...r, [id]: { ...r[id], action } }));
  const setName = (id: string, newName: string) =>
    setRows((r) => ({ ...r, [id]: { ...r[id], newName } }));

  const counts = React.useMemo(() => {
    let bump = 0, archive = 0, keep = 0;
    for (const c of activeClasses) {
      const a = rows[c.id]?.action ?? "keep";
      if (a === "bump") bump++;
      else if (a === "archive") archive++;
      else keep++;
    }
    return { bump, archive, keep };
  }, [rows, activeClasses]);

  const apply = () => {
    setClassDataMap((prev) => {
      const next = { ...prev };
      for (const c of activeClasses) {
        const st = rows[c.id];
        const cd = prev[c.id];
        if (!st || !cd) continue;
        if (st.action === "bump") {
          next[c.id] = {
            ...cd,
            info: {
              ...cd.info,
              name: st.newName.trim() || cd.info.name,
              // Daraja bittaga oshadi, lekin bitiruvchi darajadan oshmaydi (grade maks = 11).
              ...(cd.info.grade != null
                ? { grade: Math.min(cd.info.grade + 1, GRADUATING_GRADE) }
                : {}),
            },
          };
        } else if (st.action === "archive") {
          next[c.id] = { ...cd, info: { ...cd.info, archivedAt: new Date().toISOString() } };
        }
        // keep → tegilmaydi
      }
      return next;
    });
    const parts: string[] = [];
    if (counts.bump) parts.push(`${counts.bump} koʻchirildi`);
    if (counts.archive) parts.push(`${counts.archive} arxivlandi`);
    toast.success(parts.length ? `Sinflar: ${parts.join(", ")}` : "Sinflar oʻzgarmadi");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} width="46rem" className="gap-0 overflow-hidden p-0">
        <DialogHeaderBar
          icon={<Sparkles className="size-[18px]" />}
          title="Sinflarni yangi yilga oʻtkazish"
          description={
            yearLabel
              ? `${yearLabel} oʻquv yili — sinf nomlarini yangilang yoki bitiruvchilarni arxivlang.`
              : "Sinf nomlarini yangilang yoki bitiruvchilarni arxivlang."
          }
        />

        <div className="max-h-[26rem] space-y-1.5 overflow-y-auto p-5">
          {activeClasses.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Oʻtkaziladigan faol sinf yoʻq.
            </p>
          ) : (
            activeClasses.map((c) => {
              const st = rows[c.id] ?? { action: "keep" as RolloverAction, newName: c.name };
              const hex = CLASS_COLOR_HEX[classColor(c)];
              // Bitiruvchi (11) va darajasiz guruhlar koʻchirilmaydi — daraja 12 boʻlib qolmasin.
              const canBump = c.grade != null && c.grade < GRADUATING_GRADE;
              return (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-3.5 py-2.5"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span
                      className="flex size-7 shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: `color-mix(in srgb, ${hex} 14%, transparent)` }}
                    >
                      <GraduationCap className="size-3.5" style={{ color: hex }} />
                    </span>
                    <span className="truncate text-sm font-medium text-foreground">{c.name}</span>
                    {st.action === "bump" && (
                      <>
                        <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                        <Input
                          value={st.newName}
                          onChange={(e) => setName(c.id, e.target.value)}
                          className="h-8 w-24"
                          aria-label={`${c.name} yangi nomi`}
                        />
                      </>
                    )}
                    {st.action === "archive" && (
                      <span className="text-xs text-muted-foreground line-through">arxivlanadi</span>
                    )}
                    {st.action === "keep" && (
                      <span className="text-xs text-muted-foreground">oʻzgarmaydi</span>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5">
                    {canBump && (
                      <RolloverActionButton
                        label="Koʻchirish"
                        active={st.action === "bump"}
                        onClick={() => setAction(c.id, "bump")}
                      />
                    )}
                    <RolloverActionButton
                      label="Saqlash"
                      active={st.action === "keep"}
                      onClick={() => setAction(c.id, "keep")}
                    />
                    <RolloverActionButton
                      label="Arxivlash"
                      active={st.action === "archive"}
                      onClick={() => setAction(c.id, "archive")}
                      danger
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="items-center gap-2 border-t border-border px-5 py-3.5 sm:justify-between">
          <span className="text-xs text-muted-foreground">
            {counts.bump} koʻchiriladi · {counts.archive} arxivlanadi · {counts.keep} oʻzgarmaydi
          </span>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline">Oʻtkazib yuborish</Button>
            </DialogClose>
            <Button onClick={apply} disabled={activeClasses.length === 0} className="gap-1.5">
              <Sparkles className="size-4" />
              Oʻtkazish
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RolloverActionButton({
  label,
  active,
  onClick,
  danger,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? danger
            ? "bg-destructive text-white"
            : "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
