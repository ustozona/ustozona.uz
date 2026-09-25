/* ════════════════════════════════════════════════════════════════════
   GʻILDIRAK VIDJETI — holat va hovuz hisobi (sof maʼlumot).

   Qarorlar: docs/doska-gildirak-spec.md («Qarorlar», R294–R306).

   Nega ismlar ID bilan emas, MATN bilan saqlanadi: v1 da roʻyxat
   oʻqituvchi yozgan satrlar, ularning boshqa kaliti yoʻq. Ikki «Aziz»
   boʻlsa ular multitoʻplam sifatida sanaladi — biri soʻralsa, ikkinchisi
   gʻildirakda qoladi. Sinf roʻyxati ulanganda (v1.1) oʻquvchi ID si
   qoʻshiladi va bu fayl `.v2` holatini oladi (R131).

   ⚠️ Bu yerda faqat dars davomida SAQLANISHI kerak boʻlgan narsa bor.
   Qaysi tomon ochiqligi (gʻildirak/roʻyxat) va oxirgi gʻolib kartochkasi
   ATAYLAB yoʻq — ular komponent holati. Saqlansa, ertasi kuni proyektor
   ochilganda sinf oldida butun ismlar roʻyxati yoki kechagi gʻolib
   chiqib turardi (R297, R300).
   ════════════════════════════════════════════════════════════════════ */

/** «Hamma bir martadan» — soʻralgan chiqadi; «Qaytarilsin» — qoladi. */
export type WheelMode = "once" | "repeat";
export type WheelSpeed = "short" | "medium" | "long";

export type WheelState = {
  /**
   * Oʻqituvchi yozgan roʻyxat — XOM matn, qatorlari bilan.
   * Boʻsh boʻlsa gʻildirakda namuna ismlar aylanadi (R303) — ular
   * tarjimadan keladi, shuning uchun bu yerda saqlanmaydi.
   */
  text: string;
  /** Joriy aylanmada soʻralganlar, tartib bilan. */
  picked: string[];
  mode: WheelMode;
  /** Gʻildirakning tinch burchagi — sahifa yangilansa ham joyida tursin. */
  rotation: number;
  sound: boolean;
  speed: WheelSpeed;
};

/** Aylanish davomiyligi va aylanishlar soni. */
export const WHEEL_SPEEDS: Record<WheelSpeed, { ms: number; turns: number }> = {
  short: { ms: 2500, turns: 4 },
  medium: { ms: 4500, turns: 6 },
  long: { ms: 8000, turns: 10 },
};

/**
 * `prefers-reduced-motion` da — qisqa, bitta aylanish. Aylanishning
 * oʻzi olib tashlanmaydi: u natijani koʻrsatadi, bezak emas.
 */
export const WHEEL_REDUCED_SPEED = { ms: 700, turns: 1 };

/**
 * Gʻildirakka shuncha ism sigʻadi — boʻlaklar oʻqiladigan boʻlsin.
 * Undan ortigʻi JIMGINA tashlanmaydi: roʻyxat tomonida ogohlantirish
 * chiqadi (`parseEntries` hammasini qaytaradi, kesish chaqiruvchida).
 */
export const WHEEL_MAX_ENTRIES = 60;

/**
 * Saqlangan holatni oʻqiydi. localStorageʼdagi eski yoki buzilgan qiymat
 * vidjetni sindirmasin — har maydon alohida tekshiriladi.
 */
export function readWheelState(state: Record<string, unknown>): WheelState {
  const speed = state.speed;
  return {
    text: typeof state.text === "string" ? state.text : "",
    picked: Array.isArray(state.picked)
      ? state.picked.filter((x): x is string => typeof x === "string")
      : [],
    mode: state.mode === "repeat" ? "repeat" : "once",
    rotation: typeof state.rotation === "number" && Number.isFinite(state.rotation) ? state.rotation : 0,
    sound: state.sound !== false,
    speed: speed === "short" || speed === "long" ? speed : "medium",
  };
}

/** Matndan ismlar: har qator bitta, boʻsh qatorlar tashlanadi. Kesmaydi. */
export function parseEntries(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Hali soʻralmaganlar — roʻyxatdan soʻralganlarni MULTITOʻPLAM sifatida
 * ayirish. Tartib roʻyxatdagidek qoladi, shuning uchun gʻildirakdagi
 * boʻlaklar har aylanishdan keyin aralashib ketmaydi.
 *
 * Roʻyxatda endi yoʻq ism `picked` da qolsa (oʻqituvchi uni oʻchirgan)
 * u hisobga olinmaydi — hech kimni «ortiqcha» chiqarib yubormaydi.
 */
export function remainingPool(entries: string[], picked: string[]): string[] {
  const left = new Map<string, number>();
  for (const name of picked) left.set(name, (left.get(name) ?? 0) + 1);

  const pool: string[] = [];
  for (const name of entries) {
    const n = left.get(name) ?? 0;
    if (n > 0) left.set(name, n - 1);
    else pool.push(name);
  }
  return pool;
}

/**
 * `picked` ning roʻyxatda HALI BOR qismi — `remainingPool` ning teskarisi.
 * Qaytadi: `picked` dagi indeksi bilan (qoʻlda qaytarish uchun kerak).
 *
 * Roʻyxatda yoʻq ismlar tashlanadi: til almashganda namuna ismlar
 * boshqasiga oʻzgaradi, oʻqituvchi esa roʻyxatni tahrirlaydi — eski
 * ism «Soʻralganlar» da gʻildirakda yoʻq bola boʻlib qolmasin.
 */
export function pickedInList(
  entries: string[],
  picked: string[],
): { name: string; index: number }[] {
  const left = new Map<string, number>();
  for (const name of entries) left.set(name, (left.get(name) ?? 0) + 1);

  const out: { name: string; index: number }[] = [];
  picked.forEach((name, index) => {
    const n = left.get(name) ?? 0;
    if (n > 0) {
      left.set(name, n - 1);
      out.push({ name, index });
    }
  });
  return out;
}

/** Roʻyxatdan shu ismning OXIRGI uchrashini olib tashlaydi. */
export function withoutLast(list: string[], name: string): string[] {
  const i = list.lastIndexOf(name);
  return i < 0 ? list : [...list.slice(0, i), ...list.slice(i + 1)];
}
