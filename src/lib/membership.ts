import { isDateKeyShape } from "@/lib/date-keys";

/* ════════════════════════════════════════════════════════════════════
   SINF AʼZOLIGI — «bola shu kuni shu guruhda edimi?» YAGONA QOIDASI.

   docs/sinf-azoligi-spec.md. Sayt (katak yopish, roʻyxat), server
   (yozuvni rad etish, roʻyxat soʻrovlari) va mobil — hammasi shu
   funksiyalardan foydalanadi. Uch joyda uch xil solishtirish yozilmasin:
   ilgari aynan shu sababli toʻrt joyda «ketgan bola» tekshiruvi
   unutilgan edi.

   Oraliq YARIM-OCHIQ: [joinedAt, leftAt).
     • joinedAt — sinfdagi birinchi kun; null = boshidan (oddiy qoʻshish,
       eski yozuvlar — oʻqituvchi oldingi haftalarni toʻldira oladi).
     • leftAt — sinfda BOʻLMAGAN birinchi kun; null = hozir ham shu yerda.
       15-sentabrda koʻchdi → 15-sentabr YANGI sinfniki.

   Neytral modul: "use server" ham, "server-only" ham YOʻQ — mijoz va
   server bir xil import qiladi.
   ════════════════════════════════════════════════════════════════════ */

/** Bitta aʼzolik davri: `from` — birinchi kun (null = boshidan), `to` —
    sinfda BOʻLMAGAN birinchi kun (null = hozir ham shu yerda). */
export type MembershipPeriod = {
  from: string | null;
  to: string | null;
};

export type MembershipSpan = {
  joinedAt?: string | null;
  leftAt?: string | null;
  /** Bola sinfga bir necha marta kirib-chiqqan boʻlsa — barcha davrlar
      (`joinedAt`/`leftAt` esa OXIRGI davrniki). Yoʻq boʻlsa aʼzolik
      `joinedAt`/`leftAt` dagi bitta davr. */
  periods?: MembershipPeriod[];
};

/**
 * Bola `date` kuni aʼzo boʻlganmi.
 *
 * Chegarasiz oraliq har qanday kunga «ha» deydi. Chegara boʻlsa sana
 * "YYYY-MM-DD" shaklida boʻlishi shart: lexikografik solishtirish faqat
 * shunda toʻgʻri ("2026-9-05" > "2026-09-15"), notoʻgʻri shakl — «yoʻq».
 */
export function isMemberOn(span: MembershipSpan, date: string): boolean {
  if (span.periods?.length) {
    return span.periods.some((p) => isMemberOn({ joinedAt: p.from, leftAt: p.to }, date));
  }
  if (!span.joinedAt && !span.leftAt) return true;
  if (!isDateKeyShape(date)) return false;
  if (span.joinedAt && date < span.joinedAt) return false;
  if (span.leftAt && date >= span.leftAt) return false;
  return true;
}

/**
 * Bola `today` ga kelib sinfdan allaqachon KETGANMI (`leftAt <= today`).
 *
 * «Ketgan» va «chiqish sanasi bor» bir narsa emas: kelajak sanaga
 * qoʻyilgan koʻchirishda bola hali sinfda — roʻyxatda odatdagidek turadi,
 * statistikaga kiradi. Server roʻyxatlari (`memberOnSql`) ham shunday
 * hisoblaydi.
 */
export function hasLeft(span: MembershipSpan, today: string): boolean {
  return !!span.leftAt && span.leftAt <= today;
}

/** Aʼzolik [from, to] (ikkalasi ham KIRITILGAN) oraligʻi bilan kamida bir
    kun kesishadimi — «shu oy / shu yil jadvalida koʻrinadimi». */
export function overlapsRange(span: MembershipSpan, from: string, to: string): boolean {
  if (span.periods?.length) {
    return span.periods.some((p) => overlapsRange({ joinedAt: p.from, leftAt: p.to }, from, to));
  }
  if (span.joinedAt && span.joinedAt > to) return false;
  if (span.leftAt && span.leftAt <= from) return false;
  return true;
}

/**
 * Davrlar birlashmasi (bolalarni birlashtirishda): ustma-ust tushgan va
 * bir-biriga tegib turgan (`to === keyingi from`) davrlar bittaga
 * qoʻshiladi. Natija boshlanish boʻyicha saralangan. `null` boshlanish —
 * eng erta, `null` tugash — cheksiz.
 */
export function mergePeriods(periods: MembershipPeriod[]): MembershipPeriod[] {
  // Boʻsh oraliq (`from === to`, «kelmadi») hech qaysi kunni qamramaydi.
  const sorted = periods.filter((p) => p.from === null || p.from !== p.to).sort((a, b) => {
    if (a.from === b.from) return 0;
    if (a.from === null) return -1;
    if (b.from === null) return 1;
    return a.from < b.from ? -1 : 1;
  });
  const out: MembershipPeriod[] = [];
  for (const p of sorted) {
    const last = out[out.length - 1];
    if (last && (last.to === null || p.from === null || p.from <= last.to)) {
      if (last.to !== null && (p.to === null || p.to > last.to)) last.to = p.to;
    } else {
      out.push({ ...p });
    }
  }
  return out;
}
