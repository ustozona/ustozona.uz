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
import { UZ_REGIONS, districtsOf } from "@/lib/uz-regions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { School, Plus, MoreHorizontal, Pencil, Trash2, UserPlus } from "lucide-react";
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
            <AlertDialogTitle>Maktabni oʻchirasizmi?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteDialog?.name}</strong> oʻchiriladi; biriktirilgan oʻqituvchilar
              maktabsiz qoladi (hisoblari saqlanadi).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Bekor qilish</AlertDialogCancel>
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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{school === "new" ? "Yangi maktab" : "Maktabni tahrirlash"}</DialogTitle>
          <DialogDescription>Maktab nomi va manzil maʼlumotlari.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-1">
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
              <SelectTrigger id="school-region">
                <SelectValue placeholder="Tanlang" />
              </SelectTrigger>
              <SelectContent>
                {UZ_REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="school-city">Tuman / shahar</Label>
            {districts.length > 0 ? (
              <Select value={city || undefined} onValueChange={setCity}>
                <SelectTrigger id="school-city">
                  <SelectValue placeholder="Tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <>
                <Input
                  id="school-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={!region}
                  placeholder={region ? "Tuman nomini yozing" : "Avval viloyatni tanlang"}
                />
                {region ? (
                  <p className="text-caption text-muted-foreground">
                    Bu viloyat tumanlari hali roʻyxatga kiritilmagan.
                  </p>
                ) : null}
              </>
            )}
          </div>
        </div>
        <DialogFooter>
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
  React.useEffect(() => {
    if (school) setTeacherId("");
  }, [school]);

  return (
    <Dialog open={!!school} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Oʻqituvchi biriktirish</DialogTitle>
          <DialogDescription>{school?.name}</DialogDescription>
        </DialogHeader>
        <div className="py-1">
          <Select value={teacherId} onValueChange={setTeacherId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Oʻqituvchi tanlang" />
            </SelectTrigger>
            <SelectContent>
              {teachers.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} ({t.email}){t.schoolId === school?.id ? " — biriktirilgan" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
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
