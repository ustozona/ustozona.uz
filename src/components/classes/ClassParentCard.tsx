"use client";

import * as React from "react";
import { toast } from "sonner";
import { unwrap } from "@/lib/action-result";
import { subjectLabel } from "@/lib/standards-data";
import { Link2, Link2Off, Plus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { panelCardAutoClass } from "@/components/DashboardPage";
import {
  getClassParentInfoAction,
  getWorkspaceMembersAction,
  setClassParentAction,
} from "@/server/actions/workspace";

/* ════════════════════════════════════════════════════════════════════
   MAʼMURIY SINF — sinf sahifasidagi bogʻlanish paneli (§4.3).

   ⭐ YAKKA MAYDONDA UMUMAN KOʻRSATILMAYDI — `ClassTeachersCard` bilan
   bir xil qoida. Yakka oʻqituvchi ikki darajani KOʻRMASLIGI kerak:
   uning uchun «7-A Matematika» shunchaki «sinf», va unga «bu qaysi
   maʼmuriy sinfga tegishli?» degan savol berilsa — javobi yoʻq savol
   boʻlardi.

   Panel maktab/jamoa maydonida maʼnoga ega: u yerda «7-A» ni admin bir
   marta taʼriflaydi, oʻqituvchilar esa oʻz fan guruhini unga ulaydi.
   ════════════════════════════════════════════════════════════════════ */

type ClassRef = { id: string; name: string; subject: string | null };

type Info = {
  parent: ClassRef | null;
  siblings: ClassRef[];
  children: ClassRef[];
  candidates: ClassRef[];
  canManage: boolean;
};

function label(c: ClassRef): string {
  return c.subject ? `${c.name} · ${subjectLabel(c.subject)}` : c.name;
}

export function ClassParentCard({ classId }: { classId: string }) {
  const [info, setInfo] = React.useState<Info | null>(null);
  const [solo, setSolo] = React.useState<boolean | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const load = React.useCallback(() => {
    getClassParentInfoAction({ classId })
      .then((r) => setInfo(unwrap(r)))
      .catch(() => setInfo(null));
    getWorkspaceMembersAction()
      .then((r) => setSolo(unwrap(r).length <= 1))
      .catch(() => setSolo(true));
  }, [classId]);

  React.useEffect(load, [load]);

  const link = (parentClassId: string | null, done: string) => {
    setPickerOpen(false);
    startTransition(async () => {
      try {
        unwrap(await setClassParentAction({ classId, parentClassId }));
        toast.success(done);
        load();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Bajarilmadi");
      }
    });
  };

  /* Yuklanmagan holatda ham koʻrsatilmaydi: panel paydo boʻlib keyin
     yoʻqolishi yakka oʻqituvchiga tushunarsiz miltillash boʻlardi. */
  if (solo !== false || !info) return null;

  const isParent = info.children.length > 0;

  return (
    <>
      <Card className={panelCardAutoClass}>
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
          <span className="text-sm font-semibold text-foreground">
            {isParent ? "Dars guruhlari" : "Maʼmuriy sinf"}
          </span>
          {info.canManage && !isParent && !info.parent && info.candidates.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2"
              disabled={pending}
              onClick={() => setPickerOpen(true)}
            >
              <Plus className="size-3.5" />
              Ulash
            </Button>
          ) : null}
        </div>

        <div className="flex flex-col gap-1 p-2">
          {isParent ? (
            <>
              <p className="px-2 pb-1 text-xs text-muted-foreground">
                Bu maʼmuriy sinf. Unga ulangan guruhlar:
              </p>
              {info.children.map((c) => (
                <div key={c.id} className="px-2 py-1 text-sm text-foreground">
                  {label(c)}
                </div>
              ))}
            </>
          ) : info.parent ? (
            <>
              <div className="flex items-center gap-2 px-2 py-1">
                <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm text-foreground">{info.parent.name}</span>
                {info.canManage ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto size-7 shrink-0"
                    disabled={pending}
                    aria-label="Bogʻlanishni uzish"
                    onClick={() => link(null, "Bogʻlanish uzildi")}
                  >
                    <Link2Off className="size-3.5" />
                  </Button>
                ) : null}
              </div>
              {info.siblings.length > 0 ? (
                <>
                  <p className="px-2 pb-1 pt-2 text-xs text-muted-foreground">
                    Shu sinfdagi boshqa guruhlar:
                  </p>
                  {info.siblings.map((c) => (
                    <div key={c.id} className="px-2 py-1 text-sm text-muted-foreground">
                      {label(c)}
                    </div>
                  ))}
                </>
              ) : null}
            </>
          ) : (
            <p className="px-2 py-1 text-xs text-muted-foreground">
              Ulanmagan. Bir sinfni bir necha guruhga boʻlib oʻtsangiz — masalan ingliz
              tili 1- va 2-guruh — ularni bitta maʼmuriy sinfga ulang.
            </p>
          )}
        </div>
      </Card>

      <CommandDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title="Maʼmuriy sinfga ulash"
        description="Bu guruh qaysi sinfning bolalaridan iborat?"
      >
        <CommandInput placeholder="Sinf nomi boʻyicha qidiring…" />
        <CommandList>
          <CommandEmpty>Ulanadigan sinf yoʻq</CommandEmpty>
          <CommandGroup heading="Ish maydoni">
            {info.candidates.map((c) => (
              <CommandItem
                key={c.id}
                value={label(c)}
                onSelect={() => link(c.id, `${c.name} ga ulandi`)}
              >
                <span className="truncate">{c.name}</span>
                {c.subject ? (
                  <span className="ml-auto truncate text-xs text-muted-foreground">
                    {subjectLabel(c.subject)}
                  </span>
                ) : null}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
