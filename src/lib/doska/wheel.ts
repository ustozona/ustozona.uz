/* ════════════════════════════════════════════════════════════════════
   GʻILDIRAK VIDJETI — holat va hovuz hisobi (sof maʼlumot).

   Qarorlar: docs/doska-gildirak-spec.md («Qarorlar», R294–R306).

   Nega ismlar ID bilan emas, MATN bilan saqlanadi: v1 da roʻyxat
   oʻqituvchi yozgan satrlar, ularning boshqa kaliti yoʻq. Ikki «Aziz»
   boʻlsa ular multitoʻplam sifatida sanaladi — biri soʻralsa, ikkinchisi
   gʻildirakda qoladi. Jurnaldan ulangan sinfda (v1.1) esa kalit —
   oʻquvchi ID si, ism faqat koʻrinish (`WheelStudent`): qisqa ism butun
   roʻyxatdan hisoblanadi va yangi bola kelganda oʻzgarishi mumkin.

   ⚠️ Bu yerda faqat dars davomida SAQLANISHI kerak boʻlgan narsa bor.
   Qaysi tomon ochiqligi (gʻildirak/roʻyxat) va oxirgi gʻolib kartochkasi
   ATAYLAB yoʻq — ular komponent holati. Saqlansa, ertasi kuni proyektor
   ochilganda sinf oldida butun ismlar roʻyxati yoki kechagi gʻolib
   chiqib turardi (R297, R300).
   ════════════════════════════════════════════════════════════════════ */

/** «Hamma bir martadan» — soʻralgan chiqadi; «Qaytarilsin» — qoladi. */
export type WheelMode = "once" | "repeat";
export type WheelSpeed = "short" | "medium" | "long";

/**
 * Jurnaldan ulangan sinf (v1.1, pullik — R296) — vidjet holatida
 * SAQLANADIGAN qismi.
 *
 * ⚠️ Ismlar bu yerda YOʻQ. Doska ekrani localStorageʼda turadi va u
 * foydalanuvchiga bogʻlanmagan: umumiy sinf kompyuterida oʻqituvchi
 * chiqib ketgandan keyin keyingi odam roʻyxatni koʻrib qolardi, Pro
 * tugagan hisob esa uni abadiy ishlataverardi. Ismlar har sahifa
 * ochilishida serverdan olinadi (`WheelRosterResult`) va faqat xotirada
 * turadi.
 */
export type WheelRoster = {
  classId: string;
  className: string;
  /** Bugun yoʻq deb belgilanganlar — oʻquvchi ID lari, gʻildirakka chiqmaydi. */
  excluded: string[];
};

/** Gʻildirakdagi bola: ID — kalit, ism — faqat koʻrinish («Aziza K.»). */
export type WheelStudent = { id: string; name: string };

/**
 * Server javobi (`wheelRosterAction`). `denied` — kirmagan, Pro emas yoki
 * sinf bu oʻqituvchiniki emas: xato emas, oddiy holat (`/doska` mehmonga
 * ham ochiq).
 */
export type WheelRosterResult =
  | { status: "ok"; className: string; students: WheelStudent[] }
  | { status: "denied" };

/**
 * Oʻqituvchining sinf roʻyxatiga kirish huquqi. Server amali
 * (`wheelAccessAction`) qaytaradi; tip shu yerda, chunki `"use server"`
 * faylidan tip eksport qilib boʻlmaydi (AGENTS.md).
 */
export type WheelAccess =
  | { access: "guest" }
  | { access: "free" }
  | { access: "pro"; classes: { id: string; name: string }[] };

export type WheelState = {
  /**
   * Oʻqituvchi yozgan roʻyxat — XOM matn, qatorlari bilan.
   * Boʻsh boʻlsa gʻildirakda namuna ismlar aylanadi (R303) — ular
   * tarjimadan keladi, shuning uchun bu yerda saqlanmaydi.
   * Sinf ulanganda (`roster`) ishlatilmaydi, lekin OʻCHIRILMAYDI —
   * uzilganda qoʻlda yozilgan roʻyxat qaytadi.
   */
  text: string;
  roster: WheelRoster | null;
  /**
   * Joriy aylanmada soʻralganlar, tartib bilan. KALITLAR: qoʻlda yozilgan
   * roʻyxatda — ism, ulangan sinfda — oʻquvchi ID si. Manba almashganda
   * (sinf ulanganda yoki uzilganda) tozalanadi, ikkisi aralashmaydi.
   */
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
    roster: readRoster(state.roster),
    picked: Array.isArray(state.picked)
      ? state.picked.filter((x): x is string => typeof x === "string")
      : [],
    mode: state.mode === "repeat" ? "repeat" : "once",
    rotation: typeof state.rotation === "number" && Number.isFinite(state.rotation) ? state.rotation : 0,
    sound: state.sound !== false,
    speed: speed === "short" || speed === "long" ? speed : "medium",
  };
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
}

function readRoster(value: unknown): WheelRoster | null {
  if (!value || typeof value !== "object") return null;
  const r = value as Record<string, unknown>;
  if (typeof r.classId !== "string" || !r.classId) return null;
  return {
    classId: r.classId,
    className: typeof r.className === "string" ? r.className : "",
    excluded: strings(r.excluded),
  };
}

/**
 * Toʻliq ismlardan gʻildirak uchun qisqa koʻrinish: «Aziza Karimova» →
 * «Aziza K.» (R297). Gʻildirakda sinf koʻradi — familiyaning toʻliqi
 * kerak emas, boʻlak esa tor.
 *
 * `students.name` = `firstName + " " + lastName` (ism birinchi —
 * `lib/import-roster.ts` va oʻquvchi qoʻshish oynalari shunday yozadi).
 *
 * Ikki bola bir xil chiqsa familiyadan harf qoʻshiladi («Aziza Ka.» /
 * «Aziza Ko.»), toʻliq ism ham bir xil boʻlsa tartib raqami. Natija
 * doim NOYOB — «soʻralganlar» ism boʻyicha sanaladi va ikki bola bitta
 * nom ostida qolib ketmasligi kerak.
 */
export function wheelDisplayNames(fullNames: string[]): string[] {
  const parts = fullNames.map((full) => {
    const words = full.trim().split(/\s+/).filter(Boolean);
    return { first: words[0] ?? "", last: words.slice(1).join(" ") };
  });
  const short = (first: string, last: string, letters: number) => {
    if (!last) return first;
    const piece = Array.from(last).slice(0, letters).join("");
    return piece.length >= Array.from(last).length ? `${first} ${last}` : `${first} ${piece}.`;
  };

  // Toʻqnashuv NUQTASIZ solishtiriladi: «Aziz K» (familiyasi bitta harf)
  // va «Aziz K.» (Karimov) satr sifatida farq qiladi, lekin sinf ularni
  // bir xil oʻqiydi.
  const key = (n: string) => n.replace(/\.$/, "");

  let letters = parts.map(() => 1);
  let names = parts.map((p, i) => short(p.first, p.last, letters[i]));
  // Toʻqnashganlar uchun familiyadan bittadan harf qoʻshib boramiz —
  // oʻzgarmay qolsa (toʻliq ism bir xil) toʻxtaymiz.
  for (let guard = 0; guard < 40; guard++) {
    const counts = new Map<string, number>();
    for (const n of names) counts.set(key(n), (counts.get(key(n)) ?? 0) + 1);
    let changed = false;
    letters = letters.map((l, i) => {
      if ((counts.get(key(names[i])) ?? 0) < 2) return l;
      const max = Array.from(parts[i].last).length;
      if (l >= max) return l;
      changed = true;
      return l + 1;
    });
    if (!changed) break;
    names = parts.map((p, i) => short(p.first, p.last, letters[i]));
  }

  // Toʻliq ism ham bir xil — tartib raqami.
  const seen = new Map<string, number>();
  const total = new Map<string, number>();
  for (const n of names) total.set(n, (total.get(n) ?? 0) + 1);
  return names.map((n) => {
    if ((total.get(n) ?? 0) < 2) return n;
    const k = (seen.get(n) ?? 0) + 1;
    seen.set(n, k);
    return `${n} (${k})`;
  });
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
