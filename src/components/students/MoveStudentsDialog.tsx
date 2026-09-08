"use client";

import * as React from "react";
import { toast } from "sonner";
import { ArrowRight, ArrowRightLeft } from "lucide-react";

import {
  Dialog, DialogContent, DialogFooter, DialogHeaderBar,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateKeyPicker } from "@/components/ui/date-key-picker";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ClassSwatch } from "@/components/ClassSwatch";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { classColor } from "@/lib/grades-data";
import type { ClassInfo } from "@/lib/grades-data";
import { useLiveClasses, useLiveClassInfo } from "@/hooks/useLiveClasses";
import { moveStudentsAction } from "@/server/actions/workspace";
import { reloadGradesFromServer } from "@/components/sync/GradesServerSync";
import { unwrap } from "@/lib/action-result";
import { todayKey } from "@/lib/date-keys";

/* ════════════════════════════════════════════════════════════════════
   OʻQUVCHINI BOSHQA SINFGA KOʻCHIRISH — yagona oyna.

   Chaqiruv joylari: sinf roʻyxatidagi «⋮», Oʻquvchilar sahifasi
   (jadval koʻrinishida «⋮», karta koʻrinishida kontekst menyu, hamda
   belgilangan guruh uchun ommaviy tugma).

   ⭐ KOʻCHIRISH ≠ QOʻSHISH. Qoʻshishda bola ikkala sinfda ham oʻqiydi;
   bu yerda esa eski sinfdan CHIQADI. Oynadagi matn shu farqni ochiq
   aytadi, chunki ikkisining oqibati juda har xil.

   Tarix koʻchmaydi: eski sinfdagi baho va davomat oʻsha yerda qoladi
   (docs/oquvchini-kochirish-spec.md §2).
   ════════════════════════════════════════════════════════════════════ */

/** Sinf nomi + rang doirasi — `ClassSwatch` (8px, yagona standart). */
function ClassLine({ info }: { info: ClassInfo }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <ClassSwatch hex={CLASS_COLOR_HEX[classColor(info)]} />
      <span className="truncate">{info.name}</span>
    </span>
  );
}

export function MoveStudentsDialog({
  open,
  onOpenChange,
  fromClassId,
  students,
  onMoved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  fromClassId: string;
  /** Koʻchiriladigan bolalar — id va koʻrsatiladigan ism. */
  students: { id: string; name: string }[];
  onMoved?: () => void;
}) {
  const classes = useLiveClasses();
  const fromInfo = useLiveClassInfo(fromClassId);
  const [toClassId, setToClassId] = React.useState<string>("");
  const [date, setDate] = React.useState<string>(todayKey());
  const [busy, setBusy] = React.useState(false);

  // Oyna har ochilganda tanlov tozalanadi — oldingi safargi maqsad sinf
  // qolib ketsa, tasodifan notoʻgʻri joyga koʻchirilardi.
  React.useEffect(() => {
    if (open) {
      setToClassId("");
      setDate(todayKey());
    }
  }, [open]);

  /* Faqat AYNI DARAJADAGI sinflar. Qoida serverda ham bor
     (`assertSameGrade`) — bu yerdagisi uni takrorlamaydi, balki
     bajarib boʻlmaydigan tanlovni koʻrsatmaydi.

     Darajasiz guruh (toʻgarak, qoʻshimcha dars) roʻyxatga umuman
     tushmaydi: `fromGrade` null boʻlsa `targets` boʻsh qoladi. */
  const fromGrade = fromInfo?.grade ?? null;
  const targets = React.useMemo(
    () =>
      fromGrade == null
        ? []
        : classes.filter(
            (c) => c.id !== fromClassId && !c.archivedAt && c.grade === fromGrade
          ),
    [classes, fromClassId, fromGrade]
  );
  const toInfo = targets.find((c) => c.id === toClassId);
  const many = students.length > 1;

  async function submit() {
    if (!toClassId || students.length === 0) return;
    setBusy(true);
    try {
      const res = unwrap(
        await moveStudentsAction({
          studentIds: students.map((s) => s.id),
          fromClassId,
          toClassId,
          date,
        })
      );
      /* ⚠️ Store'ni qoʻlda tahrir qilmaymiz — serverdan qayta yuklaymiz.
         Sabab `reloadGradesFromServer` izohida: sinxron diff'i aks holda
         koʻchirishni teskariga qaytaradi. */
      await reloadGradesFromServer();
      toast.success(
        res.moved === 1
          ? `Oʻquvchi ${toInfo?.name ?? "yangi sinf"} ga koʻchirildi`
          : `${res.moved} ta oʻquvchi ${toInfo?.name ?? "yangi sinf"} ga koʻchirildi`
      );
      onMoved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Koʻchirib boʻlmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={busy ? undefined : onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-md"
      >
        <DialogHeaderBar
          icon={<ArrowRightLeft className="size-[18px]" aria-hidden />}
          title={many ? `${students.length} oʻquvchini koʻchirish` : "Boshqa sinfga koʻchirish"}
          description={
            many
              ? "Belgilanganlar eski sinfdan chiqadi"
              : `${students[0]?.name ?? "Oʻquvchi"} eski sinfdan chiqadi`
          }
        />

        <div className="space-y-4 px-6 py-5">
          {/* Yoʻnalish — qaysi sinfdan qayerga */}
          <div className="flex items-center gap-2 text-sm font-medium">
            {fromInfo ? (
              <ClassLine info={fromInfo} />
            ) : (
              <span className="text-muted-foreground">Joriy sinf</span>
            )}
            <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            {toInfo ? (
              <ClassLine info={toInfo} />
            ) : (
              <span className="text-muted-foreground">…</span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="move-target">Qaysi sinfga</Label>
            <Select value={toClassId} onValueChange={setToClassId}>
              <SelectTrigger id="move-target" className="w-full">
                <SelectValue placeholder="Sinfni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {targets.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <ClassLine info={c} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {targets.length === 0 && (
              <p className="text-sm text-muted-foreground">
                {fromGrade == null
                  ? "Darajasiz guruhdan (toʻgarak, qoʻshimcha dars) koʻchirib boʻlmaydi — unga oʻquvchi qoʻshiladi, sinfi esa oʻzgarmaydi."
                  : `${fromGrade}-darajada boshqa sinf yoʻq. Koʻchirish faqat bir xil darajadagi sinflar orasida mumkin.`}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Koʻchish sanasi</Label>
            {/* Native <input type="date"> EMAS — brauzer taqvimi tizim
                tokenlariga boʻysunmaydi va dark mode'da ajralib qoladi. */}
            <DateKeyPicker
              value={date}
              onChange={setDate}
              ariaLabel="Koʻchish sanasi"
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Eski sinfdagi baho va davomat oʻsha yerda saqlanib qoladi.
            </p>
          </div>
        </div>

        <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Bekor qilish
          </Button>
          <Button onClick={submit} disabled={busy || !toClassId || students.length === 0}>
            {busy ? "Koʻchirilmoqda…" : "Koʻchirish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
