import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { BrandWordmark } from "@/assets/logo/brand-wordmark";
import { Button } from "@/components/ui/button";
import { optOutByUserId } from "@/server/dal/email-activation";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

/* ════════════════════════════════════════════════════════════════════
   OBUNANI BEKOR QILISH — login TALAB QILINMAYDI.

   Havola aktivatsiya xatidan keladi, imzolangan token bilan. Gmail
   ommaviy yuboruvchidan bir bosishli bekor qilishni talab qiladi,
   shuning uchun oraliq tasdiq ekrani ham yoʻq — sahifa ochilishi
   bilan bajariladi.

   ⚠️ Bu faqat AKTIVATSIYA xatlarini oʻchiradi. Parolni tiklash kabi
   tranzaksion xatlar baribir keladi — ular hisob xavfsizligi uchun
   zarur va obunaga bogʻliq emas.
   ════════════════════════════════════════════════════════════════════ */

export const metadata = {
  title: "Obuna bekor qilindi — Ustozona",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const userId = verifyUnsubscribeToken(t);

  let ok = false;
  if (userId) {
    try {
      await optOutByUserId(userId);
      ok = true;
    } catch {
      ok = false;
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4">
      <BrandWordmark shieldClassName="size-[30px]" textClassName="text-base" gapClassName="gap-3" />

      <div className="w-full max-w-md rounded-xl border border-border/60 p-6 text-center">
        {ok ? (
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
          </>
        ) : (
          <>
            <XCircle className="mx-auto size-9 text-muted-foreground" aria-hidden />
            <h1 className="heading-section mt-4">Havola ishlamadi</h1>
            <p className="text-body mt-2 text-muted-foreground">
              Havola toʻliq nusxalanmagan yoki notoʻgʻri boʻlishi mumkin. Xatdagi
              havolani toʻliq oching, yoki sozlamalardan oʻzingiz oʻchiring.
            </p>
          </>
        )}

        <Button asChild variant="outline" className="mt-6">
          <Link href="/dashboard/settings">Sozlamalarga oʻtish</Link>
        </Button>
      </div>
    </main>
  );
}
