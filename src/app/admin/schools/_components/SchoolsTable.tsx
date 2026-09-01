"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UZ_REGIONS_SORTED, districtsOf } from "@/lib/uz-regions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeaderBar,
} from "@/components/ui/dialog";
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
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { SectionIcon } from "@/components/ui/section-icon";
import { School, Plus, MoreHorizontal, Pencil, Trash2, UserPlus, Building2 } from "lucide-react";
import { useCollator } from "@/lib/use-collator";
import type { AdminSchoolItem, TeacherListItem } from "@/server/dal/admin/schools";
import {
  createSchoolAction,
  updateSchoolAction,
  deleteSchoolAction,
  assignTeacherToSchoolAction,
} from "@/server/actions/admin/schools";

export default function SchoolsTable({
  schools,
  teachers,
}: {
  schools: AdminSchoolItem[];
  teachers: TeacherListItem[];
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [formDialog, setFormDialog] = React.useState<AdminSchoolItem | "new" | null>(null);
  const [deleteDialog, setDeleteDialog] = React.useState<AdminSchoolItem | null>(null);
  const [assignDialog, setAssignDialog] = React.useState<AdminSchoolItem | null>(null);

  /* Oʻchirishni toʻsib turgan narsalar — serverdagi darvoza bilan AYNI
     shart (dal/admin/schools.ts `deleteSchool`). Bu yerdagisi faqat
     tushuntirish uchun; haqiqiy himoya serverda. */
  const deleteBlockers = React.useMemo(() => {
    if (!deleteDialog) return [];
    const b: string[] = [];
    if (deleteDialog.teacherCount > 0) b.push(`${deleteDialog.teacherCount} ta oʻqituvchi`);
    if (deleteDialog.classCount > 0) b.push(`${deleteDialog.classCount} ta sinf`);
    if (deleteDialog.studentCount > 0) b.push(`${deleteDialog.studentCount} ta oʻquvchi`);
    return b;
  }, [deleteDialog]);

  const run = async (fn: () => Promise<unknown>, okMsg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okMsg);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="shadow-none gap-0 overflow-hidden p-0">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
        <SectionIcon>
          <School />
        </SectionIcon>
        <div className="min-w-0">
          <h2 className="heading-small">Maktablar</h2>
          <p className="text-caption text-muted-foreground">{schools.length} ta maktab</p>
        </div>
        <Button className="ml-auto" size="sm" onClick={() => setFormDialog("new")}>
          <Plus />
          Yangi maktab
        </Button>
      </div>

      {schools.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <School />
            </EmptyMedia>
            <EmptyTitle>Maktab yoʻq</EmptyTitle>
            <EmptyDescription>Birinchi maktabni qoʻshing.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Nomi</TableHead>
                <TableHead>Viloyat</TableHead>
                <TableHead>Shahar</TableHead>
                <TableHead className="text-right">Oʻqituvchilar</TableHead>
                <TableHead className="w-12 pr-5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {schools.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="pl-5 font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">{s.region ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{s.city ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="tabular-nums">
                      {s.teacherCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8" disabled={busy}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onSelect={() => setAssignDialog(s)}>
                          <UserPlus />
                          Oʻqituvchi biriktirish
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setFormDialog(s)}>
                          <Pencil />
                          Tahrirlash
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setDeleteDialog(s)}
                        >
                          <Trash2 />
                          Oʻchirish
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <SchoolFormDialog
        school={formDialog}
        busy={busy}
        onClose={() => setFormDialog(null)}
        onSave={(input) =>
          run(async () => {
            if (formDialog === "new") await createSchoolAction(input);
            else if (formDialog) await updateSchoolAction({ schoolId: formDialog.id, ...input });
            setFormDialog(null);
          }, formDialog === "new" ? "Maktab yaratildi" : "Maktab yangilandi")
        }
      />

      <AssignDialog
        school={assignDialog}
        teachers={teachers}
        busy={busy}
        onClose={() => setAssignDialog(null)}
        onAssign={(teacherId) =>
          run(async () => {
            await assignTeacherToSchoolAction({ teacherId, schoolId: assignDialog!.id });
            setAssignDialog(null);
          }, "Oʻqituvchi biriktirildi")
        }
      />

      <AlertDialog open={!!deleteDialog} onOpenChange={(o) => !o && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteBlockers.length > 0
                ? "Bu maktabni oʻchirib boʻlmaydi"
                : "Maktabni oʻchirasizmi?"}
            </AlertDialogTitle>
            {/* ⚠️ Ilgari bu yerda «oʻqituvchilar maktabsiz qoladi (hisoblari
                saqlanadi)» deb yozilgan edi — bu TESKARI maʼlumot: bazada
                maktab oʻchsa sinf, oʻquvchi, baho va davomat ham cascade
                boʻylab oʻchadi (dal/admin/schools.ts `deleteSchool` izohi).
                Endi matn ikkiga boʻlinadi: boʻsh maktab — oddiy oʻchirish,
                boʻsh emasi — nima toʻsib turganini raqami bilan aytadi. */}
            <AlertDialogDescription>
              {deleteBlockers.length > 0 ? (
                <>
                  <strong>{deleteDialog?.name}</strong> ichida{" "}
                  {deleteBlockers.join(", ")} bor. Maktab oʻchirilsa bularning
                  barcha baho va davomati ham yoʻqoladi — qaytarib boʻlmaydi.
                  Avval oʻqituvchilarni boshqa maktabga koʻchiring yoki
                  maktabdan chiqaring.
                </>
              ) : (
                <>
                  <strong>{deleteDialog?.name}</strong> boʻsh — ichida sinf ham,
                  oʻquvchi ham, oʻqituvchi ham yoʻq. Oʻchirilsa hech qanday
                  maʼlumot yoʻqolmaydi.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>
              {deleteBlockers.length > 0 ? "Yopish" : "Bekor qilish"}
            </AlertDialogCancel>
            {deleteBlockers.length === 0 && (
              <AlertDialogAction
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    await deleteSchoolAction({ schoolId: deleteDialog!.id });
                    setDeleteDialog(null);
                  }, "Maktab oʻchirildi")
                }
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Oʻchirish
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

function SchoolFormDialog({
  school,
  busy,
  onClose,
  onSave,
}: {
  school: AdminSchoolItem | "new" | null;
  busy: boolean;
  onClose: () => void;
  onSave: (input: { name: string; region?: string; city?: string }) => void;
}) {
  const [name, setName] = React.useState("");
  const [region, setRegion] = React.useState("");
  const [city, setCity] = React.useState("");
  const districts = districtsOf(region);

  React.useEffect(() => {
    if (school === "new") {
      setName("");
      setRegion("");
      setCity("");
    } else if (school) {
      setName(school.name);
      setRegion(school.region ?? "");
      setCity(school.city ?? "");
    }
  }, [school]);

  return (
    <Dialog open={!!school} onOpenChange={(o) => !o && onClose()}>
      {/* Loyiha standarti: `DialogHeaderBar` (ikonka + sarlavha + ghost X).
          Shu bois `showCloseButton={false}` — aks holda ikkita X chiqadi. */}
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-sm p-0 gap-0 overflow-hidden"
      >
        <DialogHeaderBar
          icon={<Building2 className="size-[18px]" aria-hidden />}
          title={school === "new" ? "Yangi maktab" : "Maktabni tahrirlash"}
        />
        <div className="flex flex-col gap-3 p-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="school-name">Nomi</Label>
            <Input id="school-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          {/* ⚠️ Erkin matn EMAS: "Ustozona Boshqaruv" maktab → tuman →
              viloyat yigʻmasini beradi, erkin matnda esa "Toshkent" /
              "Toshkent sh." / "Tashkent" bir joy sifatida yigʻilmaydi.
              `teachers.school` ustuni aynan shu holga tushgan. */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="school-region">Viloyat</Label>
            <Select
              value={region || undefined}
              onValueChange={(v) => {
                setRegion(v);
                setCity(""); // tuman viloyatga bogʻliq — almashganda tozalanadi
              }}
            >
              <SelectTrigger id="school-region" className="w-full">
                <SelectValue placeholder="Tanlang" />
              </SelectTrigger>
              <SelectContent>
                {UZ_REGIONS_SORTED.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="school-city">Tuman / shahar</Label>
            <Select value={city || undefined} onValueChange={setCity} disabled={!region}>
              <SelectTrigger id="school-city" className="w-full">
                <SelectValue placeholder={region ? "Tanlang" : "Avval viloyatni tanlang"} />
              </SelectTrigger>
              <SelectContent>
                {districts.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="px-5 pb-5">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Bekor qilish
          </Button>
          <Button
            disabled={busy || !name.trim()}
            onClick={() => onSave({ name: name.trim(), region: region.trim(), city: city.trim() })}
          >
            Saqlash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AssignDialog({
  school,
  teachers,
  busy,
  onClose,
  onAssign,
}: {
  school: AdminSchoolItem | null;
  teachers: TeacherListItem[];
  busy: boolean;
  onClose: () => void;
  onAssign: (teacherId: string) => void;
}) {
  const [teacherId, setTeacherId] = React.useState("");
  const compare = useCollator();
  const sortedTeachers = React.useMemo(
    () => [...teachers].sort((a, b) => compare(a.name, b.name)),
    [teachers, compare]
  );

  React.useEffect(() => {
    if (school) setTeacherId("");
  }, [school]);

  return (
    <Dialog open={!!school} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-sm p-0 gap-0 overflow-hidden"
      >
        <DialogHeaderBar
          icon={<UserPlus className="size-[18px]" aria-hidden />}
          title="Oʻqituvchi biriktirish"
          description={school?.name}
        />
        <div className="p-5">
          <Select value={teacherId} onValueChange={setTeacherId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Oʻqituvchi tanlang" />
            </SelectTrigger>
            <SelectContent>
              {sortedTeachers.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} ({t.email}){t.schoolId === school?.id ? " — biriktirilgan" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter className="px-5 pb-5">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Bekor qilish
          </Button>
          <Button disabled={busy || !teacherId} onClick={() => onAssign(teacherId)}>
            Biriktirish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
