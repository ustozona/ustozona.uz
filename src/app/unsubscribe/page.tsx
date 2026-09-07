import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { BrandWordmark } from "@/assets/logo/brand-wordmark";
import { Button } from "@/components/ui/button";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";
import { unsubscribeByTokenAction } from "@/server/actions/email-activation";

/* ════════════════════════════════════════════════════════════════════
   OBUNANI BEKOR QILISH — login TALAB QILINMAYDI.

   Havola aktivatsiya xatidan keladi, imzolangan token bilan.

   ⚠️ GET RENDERDA HECH NARSA OʻZGARMAYDI. Ilgari sahifa ochilishi
   bilan oʻchirardi, lekin xatdagi havolani odam emas, MASHINA ham
   ochadi: korporativ pochta darvozasi, antivirus havola-skaneri,
   brauzer prefetch'i. Ular GET yuboradi va foydalanuvchi hech narsa
   bosmagan holda obunadan chiqib qolardi.

   Shuning uchun oʻchirish endi POST orqali — tugma bosilganda.
   Gmail'ning «bir bosishli» talabi buzilmaydi: u sahifani umuman
   ochmaydi, `/api/unsubscribe` ga POST yuboradi
   (`List-Unsubscribe-Post` sarlavhasi).

   ⚠️ Bu faqat AKTIVATSIYA xatlarini oʻchiradi. Parolni tiklash kabi
   tranzaksion xatlar baribir keladi.
   ════════════════════════════════════════════════════════════════════ */

export const metadata = {
  title: "Obunani bekor qilish — Ustozona",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; ok?: string }>;
}) {
  const { t, ok } = await searchParams;
  const tokenYaroqli = verifyUnsubscribeToken(t) !== null;
  const bajarildi = ok === "1";

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4">
      <BrandWordmark
        shieldClassName="size-[30px]"
        textClassName="text-base"
        gapClassName="gap-3"
        /* Aylanuvchi soʻz LANDING uchun — bu yerda u «Ustozona baholash»
           kabi yolgʻon kontekst koʻrsatadi (komponent izohiga qarang). */
        showRoller={false}
      />

      <div className="w-full max-w-md rounded-xl border border-border/60 p-6 text-center">
        {bajarildi ? (
          <>
            <CheckCircle2 className="mx-auto size-9 text-primary" aria-hidden />
            <h1 className="heading-section mt-4">Obuna bekor qilindi</h1>
            <p className="text-body mt-2 text-muted-foreground">
              Bundan keyin sizga yordam xatlari yuborilmaydi. Parolni tiklash kabi
              hisobingiz xavfsizligiga oid xatlar baribir keladi.
            </p>
            <p className="text-caption mt-4">
              Fikringiz oʻzgarsa, sozlamalardan qayta yoqishingiz mumkin.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/dashboard/settings">Sozlamalarga oʻtish</Link>
            </Button>
          </>
        ) : tokenYaroqli ? (
          <>
            <h1 className="heading-section">Yordam xatlarini oʻchirasizmi?</h1>
            <p className="text-body mt-2 text-muted-foreground">
              Ishni boshlashga yordam beruvchi xatlar yuborilmaydi. Parolni
              tiklash kabi xavfsizlik xatlari baribir keladi.
            </p>
            {/* Oʻzgarish faqat shu tugmadan — POST. */}
            <form action={unsubscribeByTokenAction} className="mt-6">
              <input type="hidden" name="t" value={t} />
              <Button type="submit">Ha, oʻchirilsin</Button>
            </form>
          </>
        ) : (
          <>
            <XCircle className="mx-auto size-9 text-muted-foreground" aria-hidden />
            <h1 className="heading-section mt-4">Havola ishlamadi</h1>
            <p className="text-body mt-2 text-muted-foreground">
              Havola toʻliq nusxalanmagan yoki notoʻgʻri boʻlishi mumkin. Xatdagi
              havolani toʻliq oching, yoki sozlamalardan oʻzingiz oʻchiring.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/dashboard/settings">Sozlamalarga oʻtish</Link>
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
