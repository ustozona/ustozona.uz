import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { BrandWordmark } from "@/assets/logo/brand-wordmark";
import { Button } from "@/components/ui/button";
import { previewEmailAdd } from "@/server/dal/email-add";
import { confirmEmailAddAction } from "@/server/actions/email-add";
import type { EmailAddConfirmError } from "@/lib/email-add-types";

/* ════════════════════════════════════════════════════════════════════
   EMAILNI TASDIQLASH — Telegram hisobiga email qoʻshish, login SHART EMAS.

   ⚠️ GET RENDERDA HECH NARSA OʻZGARMAYDI — `/unsubscribe` bilan bir xil
   sabab: xatdagi havolani pochta darvozasi va havola-skanerlari ham
   ochadi. Email faqat tugma bosilganda (POST) yoziladi.

   Sahifa manzil QAYSI hisobga ulanishini ochiq yozadi: xato terilgan
   manzil egasi xatni olsa, «bu mening hisobim emas» deb tugmani
   bosmay qoʻyishi uchun.
   ════════════════════════════════════════════════════════════════════ */

export const metadata = {
  title: "Emailni tasdiqlash",
  robots: { index: false, follow: false },
};

const XATO: Record<EmailAddConfirmError, { title: string; text: string }> = {
  invalid: {
    title: "Havola ishlamadi",
    text: "Havola toʻliq nusxalanmagan yoki notoʻgʻri boʻlishi mumkin. Xatdagi havolani toʻliq oching.",
  },
  expired: {
    title: "Havola eskirgan",
    text: "Havola muddati oʻtgan yoki undan keyin yangi xat soʻralgan. Sozlamalardan xatni qayta yuboring.",
  },
  taken: {
    title: "Bu email boshqa hisobga tegishli",
    text: "Bu manzil bilan Ustozonada boshqa hisob bor. Oʻsha hisobga kiring va Telegramni Sozlamalar → Telegram orqali ulang.",
  },
  done: {
    title: "Email allaqachon qoʻshilgan",
    text: "Bu hisobda email bor. Oʻzgartirish kerak boʻlsa, support@ustozona.uz ga yozing.",
  },
};

export default async function EmailTasdiqlashPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; ok?: string }>;
}) {
  const { t, ok } = await searchParams;
  const bajarildi = ok === "1";
  const preview = bajarildi ? null : await previewEmailAdd(t);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4">
      <BrandWordmark
        shieldClassName="size-[30px]"
        textClassName="text-base"
        gapClassName="gap-3"
        showRoller={false}
      />

      <div className="w-full max-w-md rounded-xl border border-border/60 p-6 text-center">
        {bajarildi ? (
          <>
            <CheckCircle2 className="mx-auto size-9 text-primary" aria-hidden />
            <h1 className="heading-section mt-4">Email tasdiqlandi</h1>
            <p className="text-body mt-2 text-muted-foreground">
              Endi hisobingizga email orqali ham kira olasiz. Parol oʻrnatish uchun
              kirish sahifasida «Parolni unutdingizmi?» ni bosing.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/dashboard/settings?section=profil">Sozlamalarga oʻtish</Link>
            </Button>
          </>
        ) : preview?.ok ? (
          <>
            <h1 className="heading-section">Emailni tasdiqlaysizmi?</h1>
            <p className="text-body mt-2 text-muted-foreground">
              <strong className="text-foreground">{preview.email}</strong> manzili{" "}
              <strong className="text-foreground">{preview.name}</strong> hisobiga ulanadi.
            </p>
            <p className="text-caption mt-3">
              Bu sizning hisobingiz boʻlmasa, tugmani bosmang — hech narsa oʻzgarmaydi.
            </p>
            <form action={confirmEmailAddAction} className="mt-6">
              <input type="hidden" name="t" value={t} />
              <Button type="submit">Ha, tasdiqlayman</Button>
            </form>
          </>
        ) : (
          <>
            <XCircle className="mx-auto size-9 text-muted-foreground" aria-hidden />
            <h1 className="heading-section mt-4">{XATO[preview?.reason ?? "invalid"].title}</h1>
            <p className="text-body mt-2 text-muted-foreground">{XATO[preview?.reason ?? "invalid"].text}</p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/dashboard/settings?section=profil">Sozlamalarga oʻtish</Link>
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
