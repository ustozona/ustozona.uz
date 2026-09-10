import {
  addToIndex,
  buildLedger,
  dropStateFor,
  findClass,
  findStaff,
  findSubject,
  indexDoc,
  periodsForShift,
  DAY_NAMES,
  WORK_DAYS,
  type Placement,
  type SchoolTimetableDoc,
} from "@/lib/school-timetable";

/* ════════════════════════════════════════════════════════════════════
   AVTOMATIK JOYLASHTIRISH.

   ⭐ Bu SOLVER EMAS va boʻlishga urinmaydi. Farqi muhim:

   Toʻliq optimizator yumshoq shartlarni ham modellashtiradi —
   oʻqituvchi qaysi kunlari kelolmaydi, fanlar hafta boʻyicha teng
   tarqalsin, oʻqituvchida «tuynuk» qolmasin, matematika kunning
   birinchi yarmida boʻlsin. Ularni hisobga olish uchun ULARNI KIRITISH
   kerak, va bu kiritish avtomat yengillashtirmoqchi boʻlgan qoʻl
   mehnatidan koʻp. Amalda natija baribir qoʻlda tuzatiladi.

   Shuning uchun bu yerdagi vazifa boshqa: QATʼIY cheklovlarni buzmasdan
   oson 80% ni qoʻyib berish va qolganini OCHIQ aytish. Zavuch qiyin
   qismini oʻzi hal qiladi — lekin 400 emas, 40 ta dars ustida.

   ── Uch qoida ────────────────────────────────────────────────────────
   1. Mavjud darslarga TEGILMAYDI. Faqat qoldiq qoʻyiladi.
   2. Qulflangan katak va ziddiyat HECH QACHON yaratilmaydi — `caution`
      («takror», «oxirgi soat») esa qabul qilinadi, u ogohlantirish.
   3. Joylashtira olmaganini yashirmaydi — sababi bilan qaytaradi.

   ── Tartib: eng qattiq cheklangandan boshlanadi ──────────────────────
   Klassik naqsh (most-constrained-first). Mos vaqti kam boʻlgan dars
   avval qoʻyiladi: agar u oxirida qoldirilsa, oson darslar uning yagona
   boʻsh katagini egallab boʻlgan boʻladi.
   ════════════════════════════════════════════════════════════════════ */

/** Qoʻyilmay qolgan soatlar — sinf-fan boʻyicha. */
export type UnplacedRow = {
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  /** Nechta soat qoʻyilmadi. */
  count: number;
  /** Nega — zavuchga koʻrsatiladi. */
  reason: string;
};

export type AutoPlaceResult = {
  /** Hujjatga yoziladigan TOʻLIQ roʻyxat (eskisi + yangilari). */
  placements: Placement[];
  /** Nechta yangi dars qoʻyildi. */
  placed: number;
  unplaced: UnplacedRow[];
};

type Demand = {
  classId: string;
  subjectId: string;
  staffId: string;
  shift: 1 | 2;
  /** Qoʻyilishi kerak boʻlgan soat. */
  count: number;
};

type Slot = { day: number; period: number };

/** Navbatdagi bitta talab + uning oxirgi oʻlchovi. */
type Candidate = {
  demand: Demand;
  slots: Slot[];
  /** Oxirgi oʻlchovdan keyin sinf yoki oʻqituvchi bandligi oʻzgardimi. */
  stale: boolean;
};

export function autoPlace(doc: SchoolTimetableDoc): AutoPlaceResult {
  /* Ishchi nusxa: kiruvchi hujjat OʻZGARTIRILMAYDI. Chaqiruvchi
     natijani koʻrib, keyin store'ga yozadi (yoki yozmaydi). */
  const placements = [...doc.placements];
  const index = indexDoc({ ...doc, placements });

  /* ⚡ Sinf boʻyicha ajratilgan roʻyxat.

     `dropStateFor` `doc.placements` ni FAQAT bitta tekshiruv uchun
     oʻqiydi — «shu kuni shu sinfda shu fan bormi». Qolgan hammasi
     indeksdan keladi. Demak unga butun maktabning 400+ darsini emas,
     faqat SHU SINFning ~30 darsini berish yetarli va natija aynan bir
     xil boʻladi. Skanerlash 400 dan 30 ga tushadi. */
  const byClass = new Map<string, Placement[]>();
  for (const pl of placements) {
    const list = byClass.get(pl.classId);
    if (list) list.push(pl);
    else byClass.set(pl.classId, [pl]);
  }
  /* Bitta qayta ishlatiladigan obyekt — har chaqiruvda yangisini
     yaratsak, 400 000 marta axlat hosil boʻlardi. */
  const scratch: SchoolTimetableDoc = { ...doc, placements: [] };
  const docFor = (classId: string): SchoolTimetableDoc => {
    scratch.placements = byClass.get(classId) ?? [];
    return scratch;
  };

  const unplaced: UnplacedRow[] = [];
  let placed = 0;
  let nextId = Date.now();

  /* Har sinf smenasidagi kataklar — bir marta hisoblanadi. */
  const slotsByShift = new Map<1 | 2, Slot[]>();
  for (const shift of [1, 2] as const) {
    const periods = periodsForShift(doc, shift);
    slotsByShift.set(
      shift,
      WORK_DAYS.flatMap((day) => periods.map((p) => ({ day, period: p.index })))
    );
  }

  const queue: Candidate[] = collectDemands(doc)
    .filter((d) => d.count > 0)
    .map((d) => ({ demand: d, slots: [], stale: true }));

  while (queue.length > 0) {
    /* ⚡ Faqat «eskirgan» nomzodlar qayta hisoblanadi.

       Ilgari har qadamda BUTUN navbat qayta oʻlchanardi — 441 dars ×
       441 nomzod × 36 katak ≈ 7 million tekshiruv, natijada 4 soniya.
       Aslida qoʻyilgan dars faqat OʻSHA SINF va OʻSHA OʻQITUVCHIning
       imkoniyatini oʻzgartiradi; qolganlarining oʻlchovi hamon toʻgʻri. */
    let bestAt = -1;
    let bestScore = Number.POSITIVE_INFINITY;

    for (let i = 0; i < queue.length; i++) {
      const c = queue[i];
      if (c.stale) {
        c.slots = validSlots(
          docFor(c.demand.classId),
          index,
          c.demand,
          slotsByShift.get(c.demand.shift) ?? []
        );
        c.stale = false;
      }
      if (c.slots.length < bestScore) {
        bestScore = c.slots.length;
        bestAt = i;
        /* Imkoniyati yoʻq yoki bittagina — undan qattiqrogʻi
           boʻlmaydi. Lekin qolganlarini ham yangilab qoʻyish kerak
           emas: ular keyingi aylanishda oʻz navbatida hisoblanadi. */
        if (bestScore === 0) break;
      }
    }

    const c = queue[bestAt];
    const d = c.demand;

    if (c.slots.length === 0) {
      unplaced.push(describe(doc, d, d.count));
      queue.splice(bestAt, 1);
      continue;
    }

    const slot = c.slots[0];
    const p: Placement = {
      id: `auto-${nextId++}`,
      classId: d.classId,
      day: slot.day,
      period: slot.period,
      shift: d.shift,
      subjectId: d.subjectId,
      staffId: d.staffId,
    };
    placements.push(p);
    addToIndex(index, p);
    const list = byClass.get(p.classId);
    if (list) list.push(p);
    else byClass.set(p.classId, [p]);
    placed++;

    /* Shu sinf yoki shu oʻqituvchiga tegishli hamma nomzod eskiradi. */
    for (const other of queue) {
      if (other.demand.classId === d.classId || other.demand.staffId === d.staffId) {
        other.stale = true;
      }
    }

    d.count--;
    if (d.count === 0) queue.splice(bestAt, 1);
  }

  return { placements, placed, unplaced };
}

/* ─────────────────────────────────────────────────────────────────────
   Yordamchilar
   ───────────────────────────────────────────────────────────────────── */

/**
 * Qoldiq daftaridan «qoʻyilishi kerak» roʻyxati.
 *
 * ⚠️ Xodimi biriktirilmagan sinf-fan CHIQARIB TASHLANMAYDI, balki
 * sababi bilan qaytariladi — aks holda avtomat jimgina ishlamay qoʻyar
 * va zavuch nega ekanini bilmasdi.
 */
function collectDemands(doc: SchoolTimetableDoc): Demand[] {
  const out: Demand[] = [];
  for (const row of buildLedger(doc)) {
    if (row.left <= 0) continue;
    const cls = findClass(doc, row.classId);
    if (!cls) continue;
    if (!row.staffId) continue;
    out.push({
      classId: row.classId,
      subjectId: row.subjectId,
      staffId: row.staffId,
      shift: cls.shift,
      count: row.left,
    });
  }
  return out;
}

/** Xodimi yoʻqligi sababli umuman qoʻyib boʻlmaydigan qatorlar. */
export function unassignedRows(doc: SchoolTimetableDoc): UnplacedRow[] {
  return buildLedger(doc)
    .filter((r) => r.left > 0 && !r.staffId)
    .map((r) => ({
      classId: r.classId,
      className: r.className,
      subjectId: r.subjectId,
      subjectName: findSubject(doc, r.subjectId)?.name ?? r.subjectId,
      count: r.left,
      reason: "oʻqituvchi biriktirilmagan",
    }));
}

/**
 * Shu dars uchun mos kataklar.
 *
 * `ok` avval, `caution` keyin — ikkalasi ham qabul qilinadi, lekin
 * ogohlantirishlisi faqat toza katak qolmaganda ishlatiladi.
 */
function validSlots(
  doc: SchoolTimetableDoc,
  index: ReturnType<typeof indexDoc>,
  d: Demand,
  slots: Slot[]
): Slot[] {
  const clean: Slot[] = [];
  const risky: Slot[] = [];

  for (const s of slots) {
    const state = dropStateFor(doc, index, {
      classId: d.classId,
      subjectId: d.subjectId,
      staffId: d.staffId,
      day: s.day,
      shift: d.shift,
      period: s.period,
    }).state;
    if (state === "ok") clean.push(s);
    else if (state === "caution") risky.push(s);
  }

  return [...clean, ...risky];
}

function describe(doc: SchoolTimetableDoc, d: Demand, count: number): UnplacedRow {
  const cls = findClass(doc, d.classId);
  const staff = findStaff(doc, d.staffId);
  return {
    classId: d.classId,
    className: cls?.name ?? d.classId,
    subjectId: d.subjectId,
    subjectName: findSubject(doc, d.subjectId)?.name ?? d.subjectId,
    count,
    /* Sabab TAXMIN emas: shu bosqichga yetgan dars uchun sinfda ham,
       oʻqituvchida ham bir vaqtning oʻzida boʻsh katak qolmagan. */
    reason: staff
      ? `${cls?.name ?? ""} va ${staff.name} bir vaqtda boʻsh boʻlgan katak qolmadi`
      : "oʻqituvchi biriktirilmagan",
  };
}

/* ─────────────────────────────────────────────────────────────────────
   ALMASHTIRISH TAKLIFI — ziddiyatni yopish uchun (3-bosqich)
   ───────────────────────────────────────────────────────────────────── */

export type SwapSuggestion = {
  /** Koʻchiriladigan dars. */
  move: Placement;
  /** Qayerga. */
  to: Slot;
  /** Odam oʻqiydigan tavsif. */
  label: string;
};

/**
 * «Bu katakni boʻshatish uchun nimani qayerga koʻchirish kerak».
 *
 * Bir qadamli zanjir: katakni band qilib turgan darsni oʻz sinfi
 * ichidagi boshqa BOʻSH va ziddiyatsiz katakka koʻchirish mumkinmi.
 *
 * ⚠️ Chuqurroq zanjir (A→B→C) ataylab qidirilmaydi: taklif zavuch bir
 * qarashda TEKSHIRA oladigan boʻlishi kerak. Ikki-uch bosqichli
 * koʻchirishni tushuntirib boʻlmaydi va ishonch yoʻqoladi.
 */
export function suggestSwaps(
  doc: SchoolTimetableDoc,
  blocking: Placement[],
  limit = 3
): SwapSuggestion[] {
  const index = indexDoc(doc);
  const out: SwapSuggestion[] = [];

  for (const p of blocking) {
    if (p.locked) continue;
    const cls = findClass(doc, p.classId);
    if (!cls) continue;

    const periods = periodsForShift(doc, cls.shift);
    for (const day of WORK_DAYS) {
      for (const per of periods) {
        if (day === p.day && per.index === p.period) continue;
        const state = dropStateFor(doc, index, {
          classId: p.classId,
          subjectId: p.subjectId,
          staffId: p.staffId,
          day,
          shift: cls.shift,
          period: per.index,
          ignorePlacementId: p.id,
        }).state;
        if (state !== "ok") continue;

        out.push({
          move: p,
          to: { day, period: per.index },
          label: `${findSubject(doc, p.subjectId)?.name ?? p.subjectId} (${cls.name}) → ${
            DAY_NAMES[day]
          }, ${per.index}-soat`,
        });
        if (out.length >= limit) return out;
        break;
      }
      if (out.length >= limit) return out;
    }
  }

  return out;
}
