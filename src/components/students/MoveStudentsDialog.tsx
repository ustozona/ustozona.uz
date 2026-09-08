"use client";

import * as React from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useLiveClasses, useLiveClassInfo } from "@/hooks/useLiveClasses";
import { moveStudentsAction } from "@/server/actions/workspace";
import { reloadGradesFromServer } from "@/components/sync/GradesServerSync";
import { unwrap } from "@/lib/action-result";
import { todayKey } from "@/lib/date-keys";

/* ════════════════════════════════════════════════════════════════════
   OʻQUVCHINI BOSHQA SINFGA KOʻCHIRISH — yagona oyna.

   Uchta joydan chaqiriladi: sinf roʻyxatidagi «⋮», Oʻquvchilar
   sahifasi (bittalab va belgilangan guruh), admin paneli.

   ⭐ KOʻCHIRISH ≠ QOʻSHISH. Qoʻshishda bola ikkala sinfda ham oʻqiydi;
   bu yerda esa eski sinfdan CHIQADI. Oynadagi matn shu farqni ochiq
   aytadi, chunki ikkisining oqibati juda har xil.

   Tarix koʻchmaydi: eski sinfdagi baho va davomat oʻsha yerda qoladi
   (docs/oquvchini-kochirish-spec.md §2).
   ════════════════════════════════════════════════════════════════════ */

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

  const targets = React.useMemo(
    () => classes.filter((c) => c.id !== fromClassId && !c.archivedAt),
    [classes, fromClassId]
  );

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
      const target = targets.find((c) => c.id === toClassId);
      toast.success(
        res.moved === 1
          ? `Oʻquvchi ${target?.name ?? "yangi sinf"} ga koʻchirildi`
          : `${res.moved} ta oʻquvchi ${target?.name ?? "yangi sinf"} ga koʻchirildi`
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {many ? `${students.length} oʻquvchini koʻchirish` : "Boshqa sinfga koʻchirish"}
          </DialogTitle>
          <DialogDescription>
            {many
              ? "Belgilangan oʻquvchilar eski sinfdan chiqadi."
              : `${students[0]?.name ?? "Oʻquvchi"} eski sinfdan chiqadi.`}{" "}
            Eski sinfdagi baho va davomat oʻsha yerda saqlanib qoladi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded-md bg-muted px-2 py-1 font-medium">
              {fromInfo?.name ?? "Joriy sinf"}
            </span>
            <ArrowRight className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {targets.find((c) => c.id === toClassId)?.name ?? "…"}
            </span>
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
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {targets.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Koʻchirish uchun boshqa sinf yoʻq.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="move-date">Koʻchish sanasi</Label>
            <Input
              id="move-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Shu sanagacha boʻlgan yozuvlar eski sinfda, keyingilari yangisida
              hisoblanadi.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
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
