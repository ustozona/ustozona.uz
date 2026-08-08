import "server-only";

/* ════════════════════════════════════════════════════════════════════
   SERVER ACTION XATOSI — NOMLANGAN SABAB

   ⛔ MUAMMO: Next.js production'da Server Action ichidagi xatoni
   MIJOZDAN YASHIRADI. Brauzerga faqat umumiy xabar va `digest`
   yetib boradi — haqiqiy sabab faqat SERVER logida qoladi.

   Bu himoya to'g'ri (xato matni ichki tuzilishni oshkor qilishi
   mumkin), lekin oqibati og'ir bo'ldi: 2026-08-08 da butun kun
   «Holatni tekshirib bo'lmadi» va «Foydalanuvchi» degan mazmunsiz
   holat ko'rindi, sabab esa auth'da, bazada va CSRF'da izlandi —
   chunki KO'RINADIGAN hech narsa yo'q edi.

   YECHIM: xatoni SERVERDA tutib, mijozga faqat SABAB NOMINI qaytarish:

     unauthorized → sessiya yo'q/tugagan  → «qaytadan kiring» (amaliy!)
     forbidden    → rol yetarli emas      → «bu hisob o'qituvchi emas»
     server       → qolgan hammasi        → «serverda xato» + belgi

   ⛔ `instanceof` ISHLATILMAYDI — VA BU ATAYLAB.
   ----------------------------------------------
   Next.js server kodini bir necha bundle'ga bo'ladi (RSC, Server
   Action, route handler) va BIR modul ular ichida IKKI marta
   yuklanishi mumkin. Shunda `session.ts` dagi klass ham ikkita bo'ladi
   va `err instanceof UnauthorizedError` YOLG'ON qaytaradi — natijada
   oddiy «sessiya tugadi» holati «serverda xato» bo'lib ko'rinadi va
   nosozlik butunlay boshqa joyda izlanadi.

   Shuning uchun `err.name` bo'yicha solishtiriladi: ikkala klass ham
   konstruktorda `this.name` ni ANIQ yozadi, ya'ni nom bundle'dan
   qat'i nazar bir xil bo'ladi. `session.ts` dagi nomlarni
   o'zgartirsangiz shu yerni ham yangilang (test bilan qulflangan).
   ════════════════════════════════════════════════════════════════════ */

export type FailureReason = "unauthorized" | "forbidden" | "server";

/** `server` sababida QO'SHIMCHA belgi — sirni oshkor qilmaydigan.

    Nega kerak: «Serverda xato» sabab haqida hech narsa aytmaydi va
    server logi har doim qo'l ostida bo'lmaydi. Xato TURI (`PostgresError`,
    `BetterAuthError`, `TypeError`) va Postgres xato KODI (`42703` —
    ustun yo'q, `42P01` — jadval yo'q, `53300` — ulanish limiti) esa
    sabab haqida darhol aytadi.

    ⛔ Xato MATNI yozilmaydi: unda so'rov, qiymat yoki ichki yo'l
    bo'lishi mumkin. Faqat nom va kod — ular sir emas. */
export type FailureDetail = { reason: FailureReason; detail?: string };

function detailOf(err: unknown): string | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const e = err as { name?: unknown; code?: unknown };
  const name = typeof e.name === "string" ? e.name : "Error";
  // Postgres kodi 5 belgidan iborat ('42703'); boshqa `code` qiymatlari
  // ham (masalan Node'ning 'ECONNREFUSED') sir emas va foydali.
  const code = typeof e.code === "string" ? e.code : undefined;
  return code ? `${name} ${code}` : name;
}

/** Istisnoni mijozga xavfsiz uzatiladigan sababga aylantiradi.

    `server` — noma'lum xato, ya'ni tekshirilishi kerak. Shuning uchun
    faqat u to'liq holda konsolga (server logiga) yoziladi:
    `unauthorized` odatiy holat va uni logga yozish shovqin qo'shardi. */
export function failureOf(err: unknown, where: string): FailureDetail {
  const name = (err as { name?: unknown } | null)?.name;
  if (name === "UnauthorizedError") return { reason: "unauthorized" };
  if (name === "ForbiddenError") return { reason: "forbidden" };
  console.error(`[${where}] kutilmagan xato:`, err);
  return { reason: "server", detail: detailOf(err) };
}
