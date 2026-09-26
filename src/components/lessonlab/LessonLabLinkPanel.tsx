"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link2, Unlink, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TelegramLinkDialog } from "@/components/telegram/TelegramLinkDialog";
import { useLessonLabLink, isLinkState } from "@/hooks/useLessonLabLink";
import { WHY_LINK_MATTERS } from "./why-link-matters";

/* Telegram (@uzlessonlabbot) bog'lanishi — Profil (ixcham) va Sozlamalar >
   Telegram (to'liq) ikkalasida ham shu yerdan ishlatiladi
   (`useLessonLabLink` orqali bitta mantiq). `variant` faqat ko'rinishni
   o'zgartiradi.

   Ulash — `TelegramLinkDialog` orqali: sayt tasdiq kodini ko'rsatadi,
   bot esa aynan shu kodni tanlatadi (begona havola bilan bog'lanib
   qolmaslik uchun). Ilgari bu yerda to'g'ridan-to'g'ri bot havolasi
   turardi — endi kodsiz bog'lab bo'lmaydi. */

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
  onChange,
  autoOpen = false,
}: {
  variant?: "full" | "compact";
  /** Bog'lanmagan bo'lsa oyna o'zi bir marta ochilsin (xatdagi
      «Telegramni ulash» tugmasi — `?ulash=1`). */
  autoOpen?: boolean;
  /** Bog'lanish holati o'zgardi (ulandi yoki uzildi) — masalan Sozlamalar
      > Telegram qolgan qatorlarni (telefon, eslatmalar) qayta o'qisin. */
  onChange?: () => void;
}) {
  const t = useTranslations("TelegramLink");
  const { status, busy, impact, refresh, requestUnlink, confirmUnlink, cancelUnlink } =
    useLessonLabLink();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const autoOpened = React.useRef(false);
  React.useEffect(() => {
    if (!autoOpen || autoOpened.current || !isLinkState(status) || status.linked) return;
    autoOpened.current = true;
    setDialogOpen(true);
  }, [autoOpen, status]);

  const onUnlinkClick = async () => {
    const blocked = await requestUnlink();
    // `blocked` bo'lmasa (`impact` bo'sh) — uzish darhol bajarilgan,
    // qo'shimcha tasdiq shart emas (`requestUnlink` o'zi bajaradi).
    if (!blocked) {
      onChange?.();
      // Uzish — o'z-o'zicha maqsad emas: odam TO'G'RI akkauntga qayta
      // bog'lamoqchi. Oynani darhol ochamiz.
      setDialogOpen(true);
    }
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
        // Belgi (xato turi + Postgres kodi) — sir EMAS, lekin sababni
        // darhol aytadi: `42703` ustun yo'q, `42P01` jadval yo'q,
        // `53300` ulanish limiti, `ECONNREFUSED` baza yopiq. Busiz
        // «Serverda xato» hech narsa demaydi va nosozlik taxmin bilan
        // izlanadi (2026-08-08 da butun kun aynan shunday ketdi).
        text: status.detail
          ? `Serverda xato (${status.detail}). Birozdan keyin qayta urinib ko'ring.`
          : "Serverda xato. Birozdan keyin qayta urinib ko'ring.",
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
            <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
              <Link2 className="size-3.5" />
              {t("connect")}
            </Button>
            {variant === "full" && (
              <span className="text-xs text-muted-foreground">@UstozonaBot</span>
            )}
          </div>
        )}
      </div>

      <TelegramLinkDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) refresh();
        }}
        onLinked={() => {
          refresh();
          onChange?.();
        }}
      />

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
            <AlertDialogAction
              onClick={async () => {
                await confirmUnlink();
                onChange?.();
                setDialogOpen(true);
              }}
            >
              Ha, baribir uzilsin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
