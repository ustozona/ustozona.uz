import { cookies } from "next/headers";
import { exchangeCode } from "@/server/lessonlab/oauth";
import { importRoster, importTests, saveImportReport } from "@/server/dal/lessonlab-import";
import { apiSource } from "@/server/dal/lessonlab-source";
import { requireTeacher } from "@/server/session";
import { bridgeTelegramIdentity } from "@/server/dal/cross-platform";

/* GET /api/lessonlab/callback?code=…&state=…

   LessonLab oʻqituvchi roziligidan keyin shu yerga qaytaradi. Bu yerda
   kod tokenga almashtiriladi va sinf/oʻquvchilar koʻchiriladi.

   Token HECH QAYERGA saqlanmaydi — import tugagach unutiladi. Saqlansa,
   u oʻgʻirlanishi mumkin boʻlgan yana bir sir boʻlardi va uni bekor
   qilish mexanizmini ham qurish kerak boʻlardi. */

export const dynamic = "force-dynamic";

function back(request: Request, params: Record<string, string>) {
  const url = new URL("/baholash", request.url);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return Response.redirect(url, 302);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const jar = await cookies();

  const stateCookie = jar.get("ll_state")?.value ?? "";
  const verifier = jar.get("ll_verifier")?.value ?? "";
  // `/start` da tanlangan maqsad: boʻsh boʻlsa sinf/oʻquvchi
  // koʻchiriladi, sinf ID boʻlsa — oʻsha sinfga testlar.
  const targetClass = jar.get("ll_class")?.value ?? "";
  // Bir martalik qiymatlar — natijadan qatʼi nazar darhol oʻchiriladi
  jar.delete("ll_state");
  jar.delete("ll_verifier");
  jar.delete("ll_class");

  const error = url.searchParams.get("error");
  if (error) return back(request, { import: "denied" });

  const code = url.searchParams.get("code") ?? "";
  const state = url.searchParams.get("state") ?? "";
  // CSRF himoyasi: qaytgan `state` biz yuborganiga mos kelishi shart,
  // aks holda boshqa saytdan kelgan soxta callback boʻlishi mumkin.
  if (!code || !state || !stateCookie || state !== stateCookie || !verifier) {
    return back(request, { import: "badstate" });
  }

  try {
    const redirectUri = new URL("/api/lessonlab/callback", request.url).toString();
    const tokens = await exchangeCode(code, verifier, redirectUri);

    // KIMLIK KOʻPRIGI — importdan OLDIN.
    // Oʻqituvchi hozir Telegram orqali «bu men» deb tasdiqladi, ya'ni
    // `teachers.id ↔ bot_users.id` faktini yozish uchun aynan shu payt
    // eng ishonchli. Importdan keyin yozilsa, import yiqilganda koʻprik
    // ham yozilmay qolardi — holbuki rozilik allaqachon berilgan.
    //
    // `importRoster` bogʻlanishni oʻzi yozadi, koʻprik esa TESKARI
    // yoʻnalish uchun kerak: bot Ustozona sinflarini shu orqali topadi.
    const bridge = await bridgeTelegramIdentity(tokens.access_token);

    /* ⛔ EGALIK NIZOSIDA IMPORT BOSHLANMAYDI.

       Ilgari natija umuman qaralmasdi (`await …;`) va koʻprik
       yozilmagan boʻlsa ham import davom etardi. Eng xavflisi —
       `taken_tg`: telegram akkaunt allaqachon BOSHQA Ustozona
       hisobiga bogʻlangan, lekin uning sinf va oʻquvchilari shu
       yerdagi hisobga koʻchib oʻtardi. Yaʼni ikki hisob oʻrtasida
       maʼlumot aralashuvi.

       `conflict` — teskarisi: shu hisob boshqa telegramga bogʻlangan.
       Unda ham import qilsak, bitta Ustozona hisobiga IKKI telegram
       akkauntning roʻyxati tushardi.

       Ikkalasi ham foydalanuvchi hal qiladigan holat (Sozlamalar →
       LessonLab), kod taxmin qilmaydi. `unavailable` esa texnik
       nosozlik — koʻprik shart emas, import davom etaveradi. */
    if (bridge.status === "taken_tg") return back(request, { import: "takentg" });
    if (bridge.status === "conflict") return back(request, { import: "otherlink" });

    const kind = targetClass ? "tests" : "roster";
    const report = targetClass
      ? await importTests(apiSource(tokens.access_token), targetClass)
      : await importRoster(apiSource(tokens.access_token));

    /* Hisobotni SAQLAYMIZ — URL'da faqat uning id'si ketadi.

       Nomlarni URL'ga solib bo'lmaydi: 25 ta nom satrga sig'maydi va
       havolani ulashgan odam begona o'quvchi/test nomlarini ko'rardi.
       Sonlar esa avvalgidek qoladi — hisobot yozilmay qolsa ham banner
       ishlashda davom etsin (`saveImportReport` yiqilsa `null`). */
    const teacher = await requireTeacher();
    const reportId = await saveImportReport(teacher.id, kind, report);

    return back(request, {
      import: "ok",
      ...(reportId ? { report: reportId } : {}),
      classes: String(report.classesCreated),
      students: String(report.studentsCreated),
      tests: String(report.testsCreated),
      // Bogʻlangan test yangilangani ALOHIDA koʻrsatiladi: «0 ta test
      // koʻchdi» degan xabar oʻqituvchini «ishlamadi» deb adashtirardi,
      // holbuki botdagi tuzatish aynan oʻsha importda oʻtgan boʻlishi
      // mumkin (`test_links`, 2026-08-09).
      updated: String(report.testsUpdated),
      conflicts: String(report.conflicts.length),
      skipped: String(report.skipped.length),
    });
  } catch {
    // Batafsil xato URL'ga chiqmaydi — u foydalanuvchi koʻradigan joy
    return back(request, { import: "failed" });
  }
}
