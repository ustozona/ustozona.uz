"use client";

import * as React from "react";
import { ExternalLink, Link2, Unlink, RefreshCw, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLessonLabLink, isLinkState } from "@/hooks/useLessonLabLink";
import { WHY_LINK_MATTERS } from "./why-link-matters";

/* LessonLab bog'lanishi — Profil (ixcham) va Sozlamalar (to'liq karta)
   ikkalasida ham shu yerdan ishlatiladi (`useLessonLabLink` orqali
   bitta mantiq). `variant` faqat ko'rinishni o'zgartiradi. */

export function WhyLinkInfo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Nega bog'lash kerak"
          className="inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <CircleAlert className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 whitespace-pre-line text-sm" side="top">
        {WHY_LINK_MATTERS}
      </PopoverContent>
    </Popover>
  );
}

export function LessonLabLinkPanel({
  variant = "full",
}: {
  variant?: "full" | "compact";
}) {
  const { status, busy, impact, refresh, requestUnlink, confirmUnlink, cancelUnlink } =
    useLessonLabLink();

  const onUnlinkClick = async () => {
    const blocked = await requestUnlink();
    // `blocked` bo'lmasa (`impact` bo'sh) — uzish darhol bajarilgan,
    // qo'shimcha tasdiq shart emas (`requestUnlink` o'zi bajaradi).
    if (!blocked) return;
  };

  if (status === "checking") {
    return <p className="text-sm text-muted-foreground">Tekshirilmoqda…</p>;
  }

  // ⛔ SABABNI KO'RSATAMIZ — «Holatni tekshirib bo'lmadi» YETARLI EMAS.
  //
  // Ilgari shu yerda aynan o'sha mazmunsiz xabar turgan edi va
  // 2026-08-08 da nosozlik butun kun noto'g'ri qatlamlarda izlandi:
  // ekranda ham, brauzer konsolida ham sabab yo'q edi (Next.js
  // production'da Server Action xatosini yashiradi). Endi sabab
  // serverda nomlanadi (`dal/_failure-reason.ts`) va foydalanuvchi
  // NIMA QILISHINI ko'radi.
  if (!isLinkState(status)) {
    const FAILURE = {
      unauthorized: {
        text: "Sessiya tugagan. Qaytadan kirsangiz bog'lanish holati ko'rinadi.",
        // Eng amaliy chiqish yo'li: sessiyani tozalab qaytadan kirish.
        // Shunchaki «qayta urinish» bu holatda HAR DOIM o'sha natijani
        // beradi — foydalanuvchi aylanib qolardi.
        action: (
          <Button variant="outline" size="sm" asChild>
            <a href="/login">Qaytadan kirish</a>
          </Button>
        ),
      },
      forbidden: {
        text: "Bu hisob o'qituvchi hisobi emas — bog'lanish faqat o'qituvchi uchun.",
        action: null,
      },
      server: {
        text: "Serverda xato. Birozdan keyin qayta urinib ko'ring.",
        action: (
          <Button variant="ghost" size="sm" onClick={refresh}>Qayta urinish</Button>
        ),
      },
    }[status.failed];

    return (
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted-foreground">{FAILURE.text}</p>
        {FAILURE.action}
      </div>
    );
  }

  const gap = variant === "compact" ? "gap-2" : "gap-3";

  return (
    <>
      <div className={`flex flex-col ${gap}`}>
        {status.linked ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-foreground">
              ✅ Telegram bog'langan
            </span>
            <Button
              variant="outline" size="sm" className="gap-1.5"
              disabled={busy} onClick={onUnlinkClick}
            >
              <Unlink className="size-3.5" />
              O'zgartirish
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild size="sm" className="gap-1.5">
              <a href={status.deepLink} target="_blank" rel="noopener noreferrer">
                <Link2 className="size-3.5" />
                Telegram botda ochish
                <ExternalLink className="size-3" />
              </a>
            </Button>
            <Button
              variant="outline" size="sm" className="gap-1.5"
              disabled={busy} onClick={refresh}
            >
              <RefreshCw className={busy ? "size-3.5 animate-spin" : "size-3.5"} />
              Yangilash
            </Button>
            {variant === "full" && (
              <span className="text-xs text-muted-foreground">
                Havola {status.expiresInMinutes} daqiqa amal qiladi
              </span>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={impact != null} onOpenChange={(open) => !open && cancelUnlink()}>
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
                  Baholar va javoblar <b>o&apos;chirilmaydi</b> — ular joyida qoladi.
                  Lekin agar bog&apos;lanish noto&apos;g&apos;ri bo&apos;lgan bo&apos;lsa, yuqoridagi
                  natijalar boshqa odamning o&apos;quvchilariga tegishli bo&apos;lishi
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
