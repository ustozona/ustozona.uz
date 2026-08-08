"use client";

import * as React from "react";
import { Link2, ExternalLink, RefreshCw } from "lucide-react";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  getLessonLabLinkStatusAction, type LinkState,
} from "@/server/actions/account-link";

/* ════════════════════════════════════════════════════════════════════
   LESSONLAB BOG'LASH DARVOZASI — `OnboardingGate` bilan bir xil naqsh

   QOIDA (2026-08-08): Ustozona ↔ LessonLab BITTA tizim. O'qituvchi
   ishni boshlashidan OLDIN ikkala tomonda ham "bitta odam" ekanini
   isbotlashi kerak — aks holda keyinroq bog'lash "8 sinf, 94 o'quvchi
   bog'lanmagan nusxa" holatiga olib keladi (2026-08-05 da amalda
   sodir bo'lgan).

   Bu LessonLab bot tomonidagi `ustozona_gate_*_middleware` bilan
   AYNAN bir xil qoidaning teskari tomoni: u yerda o'qituvchi rol
   botda tanlanguncha ishlay olmaydi, bu yerda esa Telegram
   bog'lanmaguncha dashboard'dan foydalana olmaydi.

   ⛔ NEGA `dashboard/layout.tsx` GA BITTA QATOR SIFATIDA QO'SHILDI
   -------------------------------------------------------------
   `dashboard/layout.tsx` markaziy fayl (`AGENTS.md` qoida 5). Lekin u
   yerda ALLAQACHON xuddi shu naqsh bor — `<OnboardingGate />`, ya'ni
   "hydration tugagach shart tekshirib, kerak bo'lsa to'liq ekranli
   modal ko'rsatish". Bu komponent o'sha konvensiyani AYNAN takrorlaydi
   va yoniga BITTA qator qo'shiladi — layout'ning o'z mantig'iga
   tegilmaydi.

   ⚠️ FAIL-OPEN — bot tomonidagi bilan bir xil sabab
   --------------------------------------------------
   Holat tekshiruvi (server so'rovi) xato bersa, DARVOZA OCHIQ qoladi
   (hech narsa ko'rsatilmaydi). Yopiq qilsak bitta vaqtinchalik server
   xatosi BARCHA o'qituvchilar uchun butun dashboardni to'xtatardi.
   ════════════════════════════════════════════════════════════════════ */

export default function LessonLabLinkGate() {
  const [status, setStatus] = React.useState<
    (LinkState & { required: boolean }) | null | "checking"
  >("checking");
  const [checking, setChecking] = React.useState(false);

  const check = React.useCallback(async () => {
    setChecking(true);
    try {
      const s = await getLessonLabLinkStatusAction();
      setStatus(s);
    } catch {
      // Fail-open: xatoni yutamiz, darvoza yopiq qolmasin.
      setStatus(null);
    } finally {
      setChecking(false);
    }
  }, []);

  React.useEffect(() => {
    check();
  }, [check]);

  if (status === "checking" || status === null) return null;
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
          <DialogDescription className="text-sm text-muted-foreground">
            Ustozona va LessonLab — bitta tizim. Sinf va o'quvchilaringiz
            ikkalasida ham ko'rinishi uchun, ishni boshlashdan oldin
            Telegram akkauntingizni bir marta bog'lashingiz kerak.
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
            disabled={checking} onClick={check}
          >
            <RefreshCw className={checking ? "size-4 animate-spin" : "size-4"} />
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
