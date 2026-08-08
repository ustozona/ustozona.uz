import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { redeemBotCode } from "@/server/dal/account-link";
import { getSession } from "@/server/session";

/* ════════════════════════════════════════════════════════════════════
   /bogla — LessonLab botidan kelgan akkauntni biriktirish

   Oqim: bot `/bogla` yoki «🔗 Ustozona bilan bogʻlash» tugmasi →
   bir martalik kod → shu sahifa.

   ⚠️ NEGA COOKIE KERAK
   --------------------
   Foydalanuvchi Ustozonaga kirmagan boʻlishi mumkin (aksincha, koʻpi
   aynan shu yerda birinchi marta roʻyxatdan oʻtadi). Kirish sahifasi
   esa `callbackURL` ni `/dashboard` ga QATTIQ yozgan
   (`components/login-form.tsx`) va u markaziy fayl — unga tegmaymiz.

   Shuning uchun kod URL'dan olinib httpOnly cookie'ga koʻchiriladi.
   Kirishdan keyin foydalanuvchi `/dashboard` ga tushsa ham kod
   yoʻqolmaydi: shu havolani (yoki `/bogla` ni) qayta ochsa, biriktirish
   cookie'dan bajariladi.

   ⚠️ KOD — SIR, shuning uchun `httpOnly`: JavaScript uni oʻqiy
   olmaydi, ya'ni sahifadagi begona skript (yoki XSS) uni oʻgʻirlab
   boshqa akkauntga bogʻlab yubora olmaydi. Umri kodning oʻz muddati
   bilan bir xil — 15 daqiqa.

   ⛔ BU SAHIFA COOKIE YOZMAYDI, FAQAT O'QIYDI
   --------------------------------------------
   Next.js Server Component render paytida `cookies().set()` yoki
   `.delete()` chaqirilsa ISHLAMAYDI — production'da "A server error
   occurred" bilan yiqiladi (2026-08-08 da aynan shu holat sodir
   bo'lgan: sahifa HECH NARSA render qilmasdan qulagan, hatto
   «Roʻyxatdan oʻtish» tugmasi ham ko'rinmagan).

   Yozish kerak bo'lgan yagona joy — `/api/bogla-stash` (Route
   Handler, u yerda yozish RUXSAT ETILGAN). Bu sahifa faqat o'qiydi va
   kerak bo'lganda o'sha yerga `redirect()` qiladi.

   Kodni tozalash (`.delete()`) ham shu sabab olib tashlandi — cookie
   15 daqiqada o'z-o'zidan tugaydi, qayta ishlatilsa `redeemBotCode()`
   "used" holatini qaytaradi (zararsiz).
   ════════════════════════════════════════════════════════════════════ */

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false, follow: false } };

const COOKIE = "ll_link_code";

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

export default async function BoglaPage(
  { searchParams }: { searchParams: Promise<{ c?: string }> }
) {
  const { c } = await searchParams;
  const freshCode = (c || "").trim();

  const jar = await cookies();
  const cookieCode = (jar.get(COOKIE)?.value || "").trim();

  const code = freshCode || cookieCode;

  if (!code) {
    return (
      <Shell>
        <Card
          tone="warn"
          title="Havola toʻliq emas"
          body={
            "Biriktirish kodi topilmadi.\n\n" +
            "LessonLab botiga qayting va /bogla buyrugʻini yuboring — " +
            "yangi havola beriladi."
          }
        />
      </Shell>
    );
  }

  const session = await getSession();
  if (!session) {
    // URL'da YANGI kod bor — uni saqlab qoʻyish uchun Route Handler'ga
    // oʻtamiz (bu yerda YOZIB boʻlmaydi). Cookie'da allaqachon bor
    // boʻlsa (revisit) qayta saqlashning hojati yoʻq.
    if (freshCode) {
      redirect(`/api/bogla-stash?c=${encodeURIComponent(freshCode)}`);
    }
    return (
      <Shell>
        <Card
          tone="warn"
          title="Avval Ustozonaga kiring"
          body={
            "Akkauntlarni biriktirish uchun Ustozona hisobingiz kerak.\n\n" +
            "Kirgandan (yoki roʻyxatdan oʻtgandan) soʻng shu havolani " +
            "(yoki ustozona.uz/bogla sahifasini) qayta oching — " +
            "biriktirish avtomatik yakunlanadi."
          }
          action={
            <div className="flex gap-3">
              <Link href="/login"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Kirish
              </Link>
              <Link href="/register"
                className="rounded-lg border px-4 py-2 text-sm font-medium">
                Roʻyxatdan oʻtish
              </Link>
            </div>
          }
        />
      </Shell>
    );
  }

  const result = await redeemBotCode(code);

  // ⛔ Cookie BU YERDA TOZALANMAYDI — Server Component render'da
  // `.delete()` ham `.set()` bilan bir xil sabab bilan ishlamaydi.
  // 15 daqiqada oʻz-oʻzidan tugaydi; qayta ishlatilsa `redeemBotCode`
  // "used" holatini qaytaradi — zararsiz, foydalanuvchiga tushunarli
  // xabar bilan koʻrsatiladi.

  const back = (
    <Link href="/dashboard"
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
      Boshqaruv paneliga
    </Link>
  );

  switch (result.status) {
    case "ok":
    case "already":
      return (
        <Shell>
          <Card
            tone="ok"
            title="✅ Akkauntlar biriktirildi"
            body={
              "Endi Ustozona va LessonLab bitta akkaunt sifatida ishlaydi:\n\n" +
              "• Sinf va oʻquvchilaringiz ikkala tizimda ham koʻrinadi\n" +
              "• Maʼlumot nusxalanmaydi — bir joyda tuzatsangiz, " +
              "ikkinchisida ham oʻzgaradi\n\n" +
              "Botga qaytishingiz mumkin."
            }
            action={back}
          />
        </Shell>
      );

    case "expired":
      return (
        <Shell>
          <Card
            tone="warn"
            title="Havolaning muddati oʻtdi"
            body={
              "Havola 15 daqiqa amal qiladi.\n\n" +
              "Botda /bogla buyrugʻini qayta yuboring — yangi havola beriladi."
            }
          />
        </Shell>
      );

    case "used":
      return (
        <Shell>
          <Card
            tone="warn"
            title="Havola allaqachon ishlatilgan"
            body={
              "Har havola bir marta ishlaydi.\n\n" +
              "Biriktirish amalga oshmagan boʻlsa, botda /bogla bilan " +
              "yangi havola oling."
            }
          />
        </Shell>
      );

    // Mavjud bogʻlanish JIMGINA qayta yozilmaydi: bu «telefonimni
    // almashtirdim» ham, «begona akkauntni tortib olmoqchi» ham
    // boʻlishi mumkin. Qaror foydalanuvchida qoladi.
    case "taken_uz":
      return (
        <Shell>
          <Card
            tone="err"
            title="Bu akkaunt boshqa Telegramga bogʻlangan"
            body={
              "Ustozona hisobingiz allaqachon boshqa Telegram akkauntga " +
              "biriktirilgan.\n\n" +
              "Almashtirish uchun avval sozlamalardan uzing — " +
              "shunda baho qoʻyilgan oʻquvchilar roʻyxati koʻrsatiladi."
            }
            action={back}
          />
        </Shell>
      );

    case "taken_tg":
      return (
        <Shell>
          <Card
            tone="err"
            title="Bu Telegram boshqa hisobga bogʻlangan"
            body={
              "Ushbu Telegram akkaunt boshqa Ustozona hisobiga " +
              "biriktirilgan.\n\n" +
              "Xato boʻlsa, botda /telegram_uzish buyrugʻi bilan eski " +
              "biriktirishni uzing va qaytadan urining."
            }
            action={back}
          />
        </Shell>
      );

    default:
      return (
        <Shell>
          <Card
            tone="err"
            title="Havola yaroqsiz"
            body={
              "Bu biriktirish kodi topilmadi.\n\n" +
              "Botda /bogla buyrugʻini yuboring — yangi havola beriladi."
            }
          />
        </Shell>
      );
  }
}
