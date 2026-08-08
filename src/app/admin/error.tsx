"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

/* ════════════════════════════════════════════════════════════════════
   /admin/* — XATO CHEGARASI

   NEGA KERAK: busiz admin bo'limidagi har qanday kutilmagan xato
   Next.js'ning umumiy («Application error») sahifasini beradi — na
   sabab, na chiqish yo'li. 2026-08-08 kuni ko'rsatdi: tushunarsiz xato
   sabab nosozlik butunlay boshqa qatlamlarda izlanadi.

   ⚠️ `error.message` KO'RSATILMAYDI — Next.js production'da uni
   ataylab redakt qiladi (faqat `digest` qoladi), ya'ni ko'rsatishning
   ma'nosi yo'q. `digest` esa server logidagi yozuvni topish uchun
   kerak — shuning uchun U ko'rsatiladi.

   ⛔ RUXSAT tekshiruvi bu yerda EMAS. Rol darvozasi ikki joyda:
   `admin/layout.tsx` (UX) va har bir admin DAL funksiyasida
   `requireAdmin()` (haqiqiy himoya). Bu chegara faqat KUTILMAGAN
   xatolar uchun — ruxsat masalasi bu yergacha yetib kelmaydi.
   ════════════════════════════════════════════════════════════════════ */

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-lg font-semibold">Bo&apos;limni ochib bo&apos;lmadi</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Administrator bo&apos;limida kutilmagan xato yuz berdi. Ma&apos;lumotlar
          buzilmagan — qayta urinib ko&apos;rishingiz mumkin.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            Xato belgisi: {error.digest}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button size="sm" onClick={reset}>
            Qayta urinish
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/admin">Administrator bo&apos;limi</Link>
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <Link href="/dashboard">Boshqaruv paneli</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
