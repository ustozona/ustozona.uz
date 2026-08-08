"use client";

import * as React from "react";
import { ExternalLink, Link2, Unlink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SettingsCard } from "./SettingsShared";
import {
  getLessonLabLinkStatusAction, unlinkLessonLabAction,
  type LinkState, type UnlinkImpactRow,
} from "@/server/actions/account-link";

/* LessonLab bog'lanishini SOZLAMALARDAN boshqarish.

   Bu — `LessonLabLinkGate` bilan bir xil harakatlarni (holatni ko'rish,
   yangi havola, uzish) o'qituvchi O'ZI xohlaganda ochib ko'ra oladigan
   joy, majburiy modaldan tashqarida. Botdagi `/telegram_uzish` bilan
   bir xil qoida: oqibat oldindan ko'rsatiladi, tasdiqsiz uzilmaydi. */

type State = (LinkState & { required: boolean }) | null | "checking";

export default function LessonLabSection() {
  const [status, setStatus] = React.useState<State>("checking");
  const [busy, setBusy] = React.useState(false);
  const [impact, setImpact] = React.useState<UnlinkImpactRow[] | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setBusy(true);
    try {
      setStatus(await getLessonLabLinkStatusAction());
    } catch {
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const requestUnlink = async () => {
    setBusy(true);
    try {
      const result = await unlinkLessonLabAction(false);
      if ("blocked" in result) {
        setImpact(result.impact);
        setConfirmOpen(true);
        return;
      }
      setStatus({ ...result, required: status && status !== "checking" ? status.required : true });
    } catch {
      // jim — foydalanuvchi "Yangilash" bilan qayta urinishi mumkin
    } finally {
      setBusy(false);
    }
  };

  const confirmUnlink = async () => {
    setBusy(true);
    setConfirmOpen(false);
    try {
      const result = await unlinkLessonLabAction(true);
      if (!("blocked" in result)) {
        setStatus({ ...result, required: status && status !== "checking" ? status.required : true });
      }
    } finally {
      setBusy(false);
      setImpact(null);
    }
  };

  return (
    <>
      <SettingsCard
        title="LessonLab bog'lanishi"
        description="Ustozona va LessonLab — bitta tizim. Bog'langan bo'lsangiz, sinf va o'quvchilaringiz ikkalasida ham ko'rinadi."
        action={
          status !== "checking" && status !== null ? (
            <Badge variant={status.linked ? "secondary" : "outline"}>
              {status.linked ? "Bog'langan" : "Bog'lanmagan"}
            </Badge>
          ) : null
        }
      >
        <div className="rounded-xl border border-border bg-card px-4 py-4">
          {status === "checking" ? (
            <p className="text-sm text-muted-foreground">Tekshirilmoqda…</p>
          ) : status === null ? (
            <p className="text-sm text-muted-foreground">
              Holatni tekshirib bo'lmadi. Birozdan keyin qayta urining.
            </p>
          ) : status.linked ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Telegram akkauntingiz LessonLab bilan bog'langan.
              </p>
              <Button
                variant="outline" size="sm" className="w-fit gap-2 text-destructive"
                disabled={busy} onClick={requestUnlink}
              >
                <Unlink className="size-4" />
                Bog'lanishni uzish
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Hali bog'lanmagansiz. Havola {status.expiresInMinutes} daqiqa
                amal qiladi.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" className="gap-2">
                  <a href={status.deepLink} target="_blank" rel="noopener noreferrer">
                    <Link2 className="size-4" />
                    Telegram botda ochish
                    <ExternalLink className="size-3.5" />
                  </a>
                </Button>
                <Button
                  variant="outline" size="sm" className="gap-2"
                  disabled={busy} onClick={refresh}
                >
                  <RefreshCw className={busy ? "size-4 animate-spin" : "size-4"} />
                  Yangilash
                </Button>
              </div>
            </div>
          )}
        </div>
      </SettingsCard>

      {/* Oqibat tasdig'i — botdagi /telegram_uzish bilan bir xil qoida:
          baho/javobi bor o'quvchi topilsa, tasdiqsiz uzilmaydi. */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Diqqat — bu o'quvchilarda ish bor</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-left">
                <ul className="list-disc space-y-1 pl-4">
                  {(impact ?? []).slice(0, 8).map((row) => (
                    <li key={row.uzStudentId}>
                      <b>{row.studentName}</b> ({row.className}) —{" "}
                      {[
                        row.gradeCount ? `${row.gradeCount} baho` : null,
                        row.responseCount ? `${row.responseCount} javob` : null,
                      ].filter(Boolean).join(", ")}
                    </li>
                  ))}
                  {(impact?.length ?? 0) > 8 && (
                    <li>… va yana {(impact?.length ?? 0) - 8} ta o'quvchi</li>
                  )}
                </ul>
                <p>
                  Baholar va javoblar <b>o'chirilmaydi</b> — ular joyida qoladi.
                  Lekin agar bog'lanish noto'g'ri bo'lgan bo'lsa, yuqoridagi
                  natijalar boshqa odamning o'quvchilariga tegishli bo'lishi
                  mumkin.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnlink}>
              Ha, baribir uzilsin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
