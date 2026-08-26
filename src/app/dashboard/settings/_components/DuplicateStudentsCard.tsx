"use client";

import * as React from "react";
import { toast } from "sonner";
import { Merge } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  findDuplicateStudentsAction,
  mergeStudentsAction,
} from "@/server/actions/workspace";
import { SettingsCard } from "./SettingsShared";

/* ════════════════════════════════════════════════════════════════════
   DUBLIKAT OʻQUVCHILAR — taklif, amal emas.

   ⚠️ Bir xil ism DALIL emas, TAXMIN: maktabda haqiqatan ikkita
   «Bobur Aliyev» boʻlishi mumkin. Shu bois hech narsa avtomatik
   birlashtirilmaydi va tugma matni «Birlashtirish» — «Tozalash» emas.

   🔴 Birlashtirish qaytarilmas, shuning uchun tasdiq oynasida QAYSI
   yozuv qolishi va qaysi biri yoʻqolishi ochiq yoziladi.
   ════════════════════════════════════════════════════════════════════ */

type Group = {
  key: string;
  students: { id: string; name: string; classNames: string[]; createdAt: Date }[];
};

export function DuplicateStudentsCard() {
  const [groups, setGroups] = React.useState<Group[] | null>(null);
  const [confirming, setConfirming] = React.useState<{
    survivor: Group["students"][number];
    loser: Group["students"][number];
  } | null>(null);
  const [pending, startTransition] = React.useTransition();

  const load = React.useCallback(() => {
    findDuplicateStudentsAction()
      .then(setGroups)
      .catch(() => setGroups([]));
  }, []);

  React.useEffect(load, [load]);

  // Dublikat yoʻq — karta umuman koʻrsatilmaydi (boʻsh holat shovqin).
  if (!groups || groups.length === 0) return null;

  const merge = () => {
    if (!confirming) return;
    const { survivor, loser } = confirming;
    setConfirming(null);
    startTransition(async () => {
      try {
        await mergeStudentsAction({ survivorId: survivor.id, loserId: loser.id });
        toast.success(`${survivor.name} — yozuvlar birlashtirildi`);
        load();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Birlashtirib boʻlmadi");
      }
    });
  };

  return (
    <>
      <SettingsCard
        title="Takrorlanuvchi oʻquvchilar"
        description="Bir xil ismli yozuvlar topildi. Bu odatda ikki oʻqituvchi bir bolani alohida kiritganda boʻladi — lekin haqiqatan ikkita bir xil ismli bola ham boʻlishi mumkin, shuning uchun qarorni siz qabul qilasiz."
      >
        <div className="flex flex-col gap-4">
          {groups.map((g) => {
            const [survivor, ...rest] = g.students;
            return (
              <div key={g.key} className="rounded-lg border border-border p-3">
                <div className="mb-2 text-sm font-medium text-foreground">{survivor.name}</div>
                <div className="flex flex-col gap-1">
                  {g.students.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">
                        {s.classNames.length > 0 ? s.classNames.join(", ") : "sinfsiz"}
                      </span>
                      {s.id === survivor.id ? (
                        <Badge variant="secondary">Saqlanadi</Badge>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {rest.map((loser) => (
                    <Button
                      key={loser.id}
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => setConfirming({ survivor, loser })}
                    >
                      <Merge className="size-3.5" />
                      Birlashtirish
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </SettingsCard>

      <AlertDialog open={confirming !== null} onOpenChange={(v) => !v && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Yozuvlar birlashtirilsinmi?</AlertDialogTitle>
            <AlertDialogDescription>
              Ikkinchi yozuvdagi hamma baho, davomat, xulq va qaydlar birinchisiga
              koʻchadi, keyin ikkinchi yozuv oʻchadi. Hech qanday maʼlumot yoʻqolmaydi —
              lekin ⚠️ bu amalni orqaga qaytarib boʻlmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={merge}>Birlashtirish</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
