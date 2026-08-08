"use client";

import { Link2, ExternalLink, RefreshCw } from "lucide-react";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLessonLabLink, isLinkState } from "@/hooks/useLessonLabLink";
import { WHY_LINK_MATTERS } from "./why-link-matters";

/* ════════════════════════════════════════════════════════════════════
   LESSONLAB BOG'LASH DARVOZASI — `OnboardingGate` bilan bir xil naqsh

   QOIDA (2026-08-08): Ustozona ↔ LessonLab BITTA tizim. O'qituvchi
   ishni boshlashidan OLDIN ikkala tomonda ham "bitta odam" ekanini
   isbotlashi kerak — aks holda keyinroq bog'lash "8 sinf, 94 o'quvchi
   bog'lanmagan nusxa" holatiga olib keladi (2026-08-05 da amalda
   sodir bo'lgan).

   Holat/amallar `useLessonLabLink()` orqali — Profil va Sozlamalar
   bilan BIR XIL mantiq (`LessonLabLinkPanel`).

   ⛔ NEGA `dashboard/layout.tsx` GA BITTA QATOR SIFATIDA QO'SHILDI
   -------------------------------------------------------------
   `dashboard/layout.tsx` markaziy fayl (`AGENTS.md` qoida 5). Lekin u
   yerda ALLAQACHON xuddi shu naqsh bor — `<OnboardingGate />`, ya'ni
   "hydration tugagach shart tekshirib, kerak bo'lsa to'liq ekranli
   modal ko'rsatish". Bu komponent o'sha konvensiyani AYNAN takrorlaydi.

   ⚠️ FAIL-OPEN — bot tomonidagi bilan bir xil sabab
   --------------------------------------------------
   Holat tekshiruvi (server so'rovi) xato bersa, DARVOZA OCHIQ qoladi.
   Yopiq qilsak bitta vaqtinchalik server xatosi BARCHA o'qituvchilar
   uchun butun dashboardni to'xtatardi.
   ════════════════════════════════════════════════════════════════════ */

export default function LessonLabLinkGate() {
  const { status, busy, refresh } = useLessonLabLink();

  // Holatni bilib bo'lmadi — darvozani KO'RSATMAYMIZ (fail-open).
  // Bot tomonidagi darvoza bilan bir xil qoida: bitta vaqtinchalik
  // nosozlik butun dashboard'ni bloklamasligi kerak. Sababni bu yerda
  // ko'rsatmaymiz — u Sozlamalar > LessonLab kartasida chiqadi.
  if (status === "checking" || !isLinkState(status)) return null;
  if (!status.required || status.linked) return null;

  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="sm:max-w-md"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Link2 className="size-6" />
          </div>
          <DialogTitle className="text-lg">
            Telegram akkauntingizni bog'lang
          </DialogTitle>
          <DialogDescription className="whitespace-pre-line text-left text-sm text-muted-foreground">
            {WHY_LINK_MATTERS}
          </DialogDescription>
        </div>

        <div className="mt-2 flex flex-col gap-2">
          <Button asChild size="lg" className="gap-2">
            <a href={status.deepLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              Telegram botda ochish
            </a>
          </Button>
          <Button
            variant="outline" size="lg" className="gap-2"
            disabled={busy} onClick={refresh}
          >
            <RefreshCw className={busy ? "size-4 animate-spin" : "size-4"} />
            Bog'ladim, tekshirish
          </Button>
        </div>

        <p className="mt-1 text-center text-xs text-muted-foreground">
          Havola {status.expiresInMinutes} daqiqa amal qiladi. Muddati
          o'tsa, «Bog'ladim, tekshirish» tugmasi yangisini beradi.
        </p>
      </DialogContent>
    </Dialog>
  );
}
