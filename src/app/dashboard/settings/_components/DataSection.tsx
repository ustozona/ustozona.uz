"use client";

import * as React from "react";
import * as XLSX from "xlsx";
import { Download, LogOut, Trash2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useLessonStore } from "@/store/useLessonStore";
import { useTaskStore } from "@/store/useTaskStore";
import { useGradesStore } from "@/store/useGradesStore";
import { cn } from "@/lib/utils";
import { SettingsGroup } from "./SettingsShared";

/** Bitta rounded konteyner ichida divider bilan ajratilган qator (davomat bo'limi patterniga mos). */
function ListRow({
  title,
  description,
  first,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  first?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 bg-card px-4 py-3",
        !first && "border-t border-border"
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{title}</span>
        {description && <span className="text-xs text-muted-foreground">{description}</span>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

const CONFIRM_WORD = "OʻCHIRISH";

export default function DataSection() {
  const lessons = useLessonStore((s) => s.lessons);
  const tasks = useTaskStore((s) => s.tasks);
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const [confirmText, setConfirmText] = React.useState("");

  const handleExport = () => {
    try {
      // Server-backed store'lardagi JORIY (hisobga tegishli) maʼlumot eksport qilinadi.
      const students = Object.entries(classDataMap).flatMap(([classId, d]) =>
        d.students.map((s) => ({ id: s.id, name: s.name, classId, className: d.info.name }))
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(students), "Oʻquvchilar");
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(Object.values(classDataMap).map((d) => d.info)),
        "Sinflar"
      );
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lessons), "Darslar");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tasks), "Topshiriqlar");
      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `ustozona-zaxira-${date}.xlsx`);
      toast.success("Maʼlumotlar yuklab olindi.");
    } catch {
      toast.error("Eksport amalga oshmadi.");
    }
  };

  const handleDelete = () => {
    try {
      localStorage.clear();
      toast.success("Hisob va barcha maʼlumotlar oʻchirildi.");
      setTimeout(() => (window.location.href = "/"), 500);
    } catch {
      toast.error("Oʻchirish amalga oshmadi.");
    }
  };

  return (
    <>
      {/* Ma'lumot */}
      <SettingsGroup
        title="Maʼlumotlaringiz"
        description="Barcha maʼlumotlaringizni bitta jadval faylида (har boʻlim alohida varaqda) yuklab oling."
      >
        <div className="overflow-hidden rounded-xl border border-border">
          <ListRow
            first
            title="Maʼlumotlarni eksport qilish"
            description="Oʻquvchilar, sinflar, darslar va topshiriqlar (.xlsx)."
          >
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="size-4" />
              Yuklab olish
            </Button>
          </ListRow>

          <ListRow
            title="Maʼlumotlarni qayta ishlash shartnomasi (DPA)"
            description="Maktab yozuvlaringiz uchun DPA (GDPR 28-modda / FERPA)."
          >
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Tez orada</Badge>
              <Button variant="outline" size="sm" disabled>
                <ShieldCheck className="size-4" />
                DPA imzolash
              </Button>
            </div>
          </ListRow>

          <ListRow title="Chiqish" description="Joriy seansni yakunlash.">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await authClient.signOut();
                // To'liq reload: xotiradagi store'larda oldingi hisob
                // ma'lumotlari qolib ketmasligi uchun.
                window.location.href = "/login";
              }}
            >
              <LogOut className="size-4" />
              Chiqish
            </Button>
          </ListRow>
        </div>
      </SettingsGroup>

      {/* Danger zone */}
      <SettingsGroup title="Xavfli hudud">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">Hisobni oʻchirish</span>
              <span className="text-xs text-muted-foreground">
                Hisob va unga bogʻliq barcha maʼlumotlar (sinflar, oʻquvchilar, baholar, davomat,
                sozlamalar) butunlay oʻchadi. Bu amalni ortga qaytarib boʻlmaydi.
              </span>
            </div>
            <AlertDialog onOpenChange={() => setConfirmText("")}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="shrink-0">
                  <Trash2 className="size-4" />
                  Hisobni oʻchirish
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hisobni butunlay oʻchirasizmi?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Barcha lokal maʼlumotlar oʻchiriladi va tiklab boʻlmaydi. Avval eksport qilib
                    olishni tavsiya qilamiz. Tasdiqlash uchun quyiga{" "}
                    <span className="font-semibold text-foreground">{CONFIRM_WORD}</span> deb yozing.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={CONFIRM_WORD}
                  autoFocus
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={confirmText.trim() !== CONFIRM_WORD}
                    className="bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50"
                  >
                    Ha, oʻchirilsin
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SettingsGroup>
    </>
  );
}
