"use client";

import * as React from "react";
import { toast } from "sonner";
import { unwrap } from "@/lib/action-result";
import { Crown, Plus, UserMinus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
import { panelCardClass } from "@/components/DashboardPage";
import {
  addClassTeacherAction,
  getClassTeachersAction,
  getWorkspaceMembersAction,
  removeClassTeacherAction,
} from "@/server/actions/workspace";

/* ════════════════════════════════════════════════════════════════════
   DARSNI KIM OʻTADI — sinf sahifasidagi hamkasblar paneli.

   ⭐ YAKKA MAYDONDA UMUMAN KOʻRSATILMAYDI (§1). Bu bezak qarori emas:
   "yakka oʻqituvchi — aʼzosi bitta maydon" va u "hamkasb" degan
   tushunchani koʻrmasligi kerak. Almashtirgich bilan bir xil qoida.

   Ruxsat mantigʻi SERVERDA (`dal/class-teachers.ts`) — bu yerdagi
   `canManage` faqat tugmani yashiradi. Ikkisi ajratilgan: UI yolgʻon
   gapirsa ham server rad etadi.
   ════════════════════════════════════════════════════════════════════ */

type TeacherItem = {
  teacherId: string;
  name: string;
  email: string;
  role: string;
  isMe: boolean;
};

type MemberItem = TeacherItem;

export function ClassTeachersCard({ classId }: { classId: string }) {
  const [teachers, setTeachers] = React.useState<TeacherItem[] | null>(null);
  const [members, setMembers] = React.useState<MemberItem[] | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [removing, setRemoving] = React.useState<TeacherItem | null>(null);
  const [pending, startTransition] = React.useTransition();

  const load = React.useCallback(() => {
    Promise.all([getClassTeachersAction({ classId }), getWorkspaceMembersAction()])
      .then(([t, m]) => {
        setTeachers(unwrap(t));
        setMembers(unwrap(m));
      })
      .catch(() => {
        setTeachers([]);
        setMembers([]);
      });
  }, [classId]);

  React.useEffect(load, [load]);

  /* ⭐ Yakka maydon — panel butunlay yoʻq. `null` (hali yuklanmagan)
     holatida ham koʻrsatilmaydi: panel paydo boʻlib keyin yoʻqolishi
     yakka oʻqituvchiga tushunarsiz miltillash boʻlardi. */
  if (!members || members.length <= 1) return null;

  const me = teachers?.find((t) => t.isMe);
  const canManage = me?.role === "owner" || members.find((m) => m.isMe)?.role === "admin";

  const attached = new Set((teachers ?? []).map((t) => t.teacherId));
  const candidates = members.filter((m) => !attached.has(m.teacherId));

  const add = (m: MemberItem) => {
    setPickerOpen(false);
    startTransition(async () => {
      try {
        unwrap(await addClassTeacherAction({ classId, teacherId: m.teacherId }));
        toast.success(`${m.name} darsga biriktirildi`);
        load();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Biriktirib boʻlmadi");
      }
    });
  };

  const remove = (t: TeacherItem) => {
    setRemoving(null);
    startTransition(async () => {
      try {
        unwrap(await removeClassTeacherAction({ classId, teacherId: t.teacherId }));
        toast.success(t.isMe ? "Darsdan chiqdingiz" : `${t.name} chiqarildi`);
        load();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Chiqarib boʻlmadi");
      }
    });
  };

  return (
    <>
      <Card className={panelCardClass}>
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
          <span className="text-sm font-semibold text-foreground">Oʻqituvchilar</span>
          {canManage && candidates.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2"
              disabled={pending}
              onClick={() => setPickerOpen(true)}
            >
              <Plus className="size-3.5" />
              Qoʻshish
            </Button>
          ) : null}
        </div>

        <div className="flex flex-col gap-1 p-2">
          {(teachers ?? []).map((t) => {
            /* Ega chiqarilmaydi — avval egalik oʻtkazilishi kerak.
               Oʻzini chiqarish har doim mumkin («leave a shared class»). */
            const canRemove = t.role !== "owner" && (canManage || t.isMe);
            return (
              <div
                key={t.teacherId}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm text-foreground">{t.name}</span>
                    {t.isMe ? (
                      <Badge variant="secondary" className="shrink-0">
                        Siz
                      </Badge>
                    ) : null}
                  </div>
                  <span className="truncate text-xs text-muted-foreground">{t.email}</span>
                </div>
                {t.role === "owner" ? (
                  <Crown
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-label="Sinf egasi"
                  />
                ) : null}
                {canRemove ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    disabled={pending}
                    aria-label={t.isMe ? "Darsdan chiqish" : `${t.name} ni chiqarish`}
                    onClick={() => setRemoving(t)}
                  >
                    <UserMinus className="size-3.5" />
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      </Card>

      <CommandDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        title="Hamkasbni biriktirish"
        description="Ish maydonidagi oʻqituvchini shu darsga qoʻshing"
      >
        <CommandInput placeholder="Ism boʻyicha qidiring…" />
        <CommandList>
          <CommandEmpty>Qoʻshiladigan oʻqituvchi yoʻq</CommandEmpty>
          {candidates.length > 0 ? (
            <CommandGroup heading="Ish maydoni">
              {candidates.map((m) => (
                <CommandItem
                  key={m.teacherId}
                  value={`${m.name} ${m.email}`}
                  onSelect={() => add(m)}
                >
                  <span className="truncate">{m.name}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">
                    {m.email}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>

      <AlertDialog open={removing !== null} onOpenChange={(v) => !v && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {removing?.isMe ? "Darsdan chiqasizmi?" : `${removing?.name} chiqarilsinmi?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {removing?.isMe
                ? "Bu darsdagi oʻquvchilar maʼlumoti sizga koʻrinmay qoladi. Siz qoʻygan baholar oʻchmaydi."
                : "Bu oʻqituvchiga darsdagi oʻquvchilar maʼlumoti koʻrinmay qoladi. U qoʻygan baholar oʻchmaydi."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={() => removing && remove(removing)}>
              {removing?.isMe ? "Chiqish" : "Chiqarish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
