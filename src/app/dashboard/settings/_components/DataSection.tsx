"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
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
import { deleteAccountAction } from "@/server/actions/account";
import { useLessonStore } from "@/store/useLessonStore";
import { useTaskStore } from "@/store/useTaskStore";
import { useGradesStore } from "@/store/useGradesStore";
import { SettingsCard, SettingsList } from "./SettingsShared";

export default function DataSection() {
  const t = useTranslations("DataSection");
  const CONFIRM_WORD = t("confirmWord");
  const lessons = useLessonStore((s) => s.lessons);
  const tasks = useTaskStore((s) => s.tasks);
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const [confirmText, setConfirmText] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);

  const handleExport = async () => {
    try {
      // xlsx faqat shu amal bosilganda yuklanadi — sozlamalar paketini kattalashtirmaydi.
      const XLSX = await import("xlsx");
      // Server-backed store'lardagi JORIY (hisobga tegishli) maʼlumot eksport qilinadi.
      const students = Object.entries(classDataMap).flatMap(([classId, d]) =>
        d.students.map((s) => ({ id: s.id, name: s.name, classId, className: d.info.name }))
      );
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(students), t("sheetStudents"));
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(Object.values(classDataMap).map((d) => d.info)),
        t("sheetClasses")
      );
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lessons), t("sheetLessons"));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tasks), t("sheetTasks"));
      const date = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `ustozona-zaxira-${date}.xlsx`);
      toast.success(t("toastExportSuccess"));
    } catch {
      toast.error(t("toastExportError"));
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Serverdagi hisobni haqiqatan oʻchiradi (user → cascade → hammasi)
      // va sessiya cookie'sini tozalaydi.
      await deleteAccountAction();
      // Eski localStorage kalitlari qolgan boʻlsa — ular ham ketsin.
      try {
        localStorage.clear();
      } catch {}
      toast.success(t("toastDeleteSuccess"));
      window.location.href = "/";
    } catch {
      setDeleting(false);
      toast.error(t("toastDeleteError"));
    }
  };

  return (
    <>
      {/* Ma'lumot */}
      <SettingsCard
        title={t("dataTitle")}
        description={t("dataDescription")}
      >
        <SettingsList
          items={[
            {
              key: "export",
              title: t("exportTitle"),
              description: t("exportDescription"),
              trailing: (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="size-4" />
                  {t("exportButton")}
                </Button>
              ),
            },
            {
              key: "dpa",
              title: t("dpaTitle"),
              description: t("dpaDescription"),
              trailing: (
                <>
                  <Badge variant="secondary">{t("comingSoon")}</Badge>
                  <Button variant="outline" size="sm" disabled>
                    <ShieldCheck className="size-4" />
                    {t("dpaButton")}
                  </Button>
                </>
              ),
            },
            {
              key: "signout",
              title: t("signoutTitle"),
              description: t("signoutDescription"),
              trailing: (
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
                  {t("signoutButton")}
                </Button>
              ),
            },
          ]}
        />
      </SettingsCard>

      {/* Danger zone */}
      <SettingsCard
        title={t("dangerTitle")}
        description={t("dangerDescription")}
        destructive
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">{t("deleteAccountLabel")}</span>
            <span className="text-xs text-muted-foreground">
              {t("deleteAccountDescription")}
            </span>
          </div>
            <AlertDialog onOpenChange={() => setConfirmText("")}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="shrink-0">
                  <Trash2 className="size-4" />
                  {t("deleteAccountButton")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("deleteDialogTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("deleteDialogDescription", {
                      word: CONFIRM_WORD,
                    })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={CONFIRM_WORD}
                  autoFocus
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      // Xato boʻlsa dialog ochiq qolsin (Radix aks holda yopadi).
                      e.preventDefault();
                      void handleDelete();
                    }}
                    disabled={confirmText.trim() !== CONFIRM_WORD || deleting}
                    className="bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50"
                  >
                    {deleting ? t("deleting") : t("confirmDelete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </SettingsCard>
    </>
  );
}
