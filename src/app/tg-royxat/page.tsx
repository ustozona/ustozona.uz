import Link from "next/link";
import { redirect } from "next/navigation";
import { readTicket } from "@/server/dal/tg-signup";
import { getSession } from "@/server/session";
import { TgSignupForm } from "./_components/TgSignupForm";

/* ════════════════════════════════════════════════════════════════════
   /tg-royxat — Telegram orqali Ustozona akkaunti ochish (yoʻnalish C)

   Oqim: Ustozonada «Telegram bilan davom etish» → bot `/start uzreg`
   → bot chipta yozadi va shu sahifaga havola beradi → bu yerda faqat
   parol soʻraladi → akkaunt yaratiladi VA telegram DARHOL biriktiriladi.

   NEGA `/bogla` YETMAYDI: u MAVJUD akkauntni biriktiradi, yaʼni odam
   avval veb formani (ism, familiya, email, parol) toʻldirib, keyin
   botga qaytishi kerak edi. 2026-08-08 da real foydalanuvchi shu
   zanjirning oʻrtasida tashlab ketdi — bogʻlanish yakunlanmadi.

   ⛔ BU SAHIFA COOKIE YOZMAYDI. Server Component render paytida
   `cookies().set()` ISHLAMAYDI va production'da «A server error
   occurred» bilan yiqiladi (aynan shu xato `/bogla` da sodir boʻlgan).
   Sessiya cookie'si Server Action ichida yoziladi — u yerda ruxsat
   etilgan (`nextCookies()` plugin).

   ⚠️ CHIPTA — SIR. Shuning uchun `robots: noindex` va
   `force-dynamic`: havola keshlanib, boshqa odamga koʻrsatilmasligi
   kerak.
   ════════════════════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
      {children}
    </main>
  );
}

function Card({
  tone, title, body, action,
}: {
  tone: "ok" | "warn" | "err";
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  const ring =
    tone === "ok" ? "border-emerald-500/40" :
    tone === "warn" ? "border-amber-500/40" : "border-red-500/40";
  return (
    <div className={`rounded-xl border ${ring} bg-card p-6 shadow-sm`}>
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

const BOT_HINT =
  "LessonLab botiga qayting va /royxat buyrugʻini yuboring — yangi havola beriladi.";

export default async function TgRoyxatPage(
  { searchParams }: { searchParams: Promise<{ t?: string }> }
) {
  const { t } = await searchParams;
  const token = (t || "").trim();

  // Allaqachon kirgan boʻlsa akkaunt YARATMAYMIZ — bu odatda «havolani
  // ikkinchi marta ochdim» holati. Ikkinchi akkaunt ochilishi esa eng
  // yomon natija: odam qaysi biriga kirganini bilmasdi va sinflari
  // «yoʻqolgan» boʻlib koʻrinardi.
  //
  // Bogʻlash kerak boʻlsa, u Sozlamalardagi mavjud panel orqali
  // bajariladi — bu yerda takrorlamaymiz.
  const session = await getSession();
  if (session) redirect("/dashboard");

  if (!token) {
    return (
      <Shell>
        <Card tone="warn" title="Havola toʻliq emas"
          body={`Roʻyxatdan oʻtish chiptasi topilmadi.\n\n${BOT_HINT}`} />
      </Shell>
    );
  }

  const info = await readTicket(token);

  if (!info.ok) {
    const CARDS: Record<string, { tone: "warn" | "err"; title: string; body: string }> = {
      invalid: {
        tone: "err", title: "Havola yaroqsiz",
        body: `Bu chipta topilmadi.\n\n${BOT_HINT}`,
      },
      expired: {
        tone: "warn", title: "Havolaning muddati oʻtdi",
        body: `Havola 15 daqiqa amal qiladi.\n\n${BOT_HINT}`,
      },
      used: {
        tone: "warn", title: "Havola allaqachon ishlatilgan",
        body:
          "Har havola bir marta ishlaydi. Akkaunt allaqachon " +
          "yaratilgan boʻlishi mumkin — avval kirishga urinib koʻring.",
      },
      taken_tg: {
        tone: "err", title: "Bu Telegram boshqa hisobga bogʻlangan",
        body:
          "Ushbu Telegram akkaunt allaqachon boshqa Ustozona hisobiga " +
          "biriktirilgan.\n\nOʻsha hisobga kiring yoki botda " +
          "/telegram_uzish buyrugʻi bilan eski biriktirishni uzing.",
      },
    };
    const c = CARDS[info.reason] ?? CARDS.invalid;
    return (
      <Shell>
        <Card tone={c.tone} title={c.title} body={c.body}
          action={
            <Link href="/login"
              className="rounded-lg border px-4 py-2 text-sm font-medium">
              Kirish sahifasi
            </Link>
          } />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-lg font-semibold">Ustozona akkauntini yakunlash</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Telegram akkauntingiz tasdiqlandi. Parol qoʻysangiz akkaunt ochiladi
          va Telegram <b>oʻzi</b> biriktiriladi — sinf va oʻquvchilaringiz
          ikkala tizimda ham koʻrinadi.
        </p>
        <div className="mt-6">
          <TgSignupForm token={token} fullName={info.fullName} />
        </div>
      </div>
    </Shell>
  );
}
