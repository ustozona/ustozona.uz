/* ════════════════════════════════════════════════════════════════════
   VARAQ GEOMETRIYASI — CHIZUVCHI BILAN SHARTNOMA

   ⚠️ BU FAYLDAGI RAQAMLAR IXTIYORIY EMAS.

   Varaqni LessonLab dvigateli chizadi
   (`/api/v1/engine/answer-sheets` → `answer_sheet_generator.py`).
   Skaner esa suratdan katak qayerda turishini SHU raqamlar bilan
   hisoblaydi. Bir tomon oʻzgarsa, ikkinchisi notoʻgʻri joyni oʻqiydi
   va — eng yomoni — buni sezmaydi: natija boʻsh emas, XATO boʻladi.

   Shuning uchun har qiymat generatordagi manbasi bilan izohlangan.
   Dvigatel yangilansa, avval shu fayl solishtiriladi.

   Tekshirish usuli: bitta varaq chop etib skanerlang. Katak toʻgʻri
   oʻqilsa geometriya mos; qatorlar surilib ketsa — `rowH` yoki
   `hdrH` farq qilyapti.
   ════════════════════════════════════════════════════════════════════ */

/** Qogʻozdagi variantlar — dvigatelda `OPTS` (A4 varaqda faqat toʻrtta). */
export const OPTION_LABELS = ["A", "B", "C", "D"] as const;

export type SheetLayout = {
  /** Savol ustunlari soni. */
  cols: number;
  /** Har ustundagi qatorlar soni. */
  rows: number;
  /** A4 sahifaga nechta varaq sigʻadi. */
  perPage: number;
};

/** Savol soni → varaq tuzilishi (`_layout()`, generator 57-75-satrlar). */
export function getLayout(questionCount: number): SheetLayout {
  if (questionCount <= 10) return { cols: 1, rows: 10, perPage: 4 };
  if (questionCount <= 20) return { cols: 2, rows: 10, perPage: 4 };
  if (questionCount <= 30) return { cols: 2, rows: 15, perPage: 4 };
  if (questionCount <= 40) return { cols: 4, rows: 10, perPage: 3 };
  if (questionCount <= 50) return { cols: 4, rows: 13, perPage: 3 };
  if (questionCount <= 60) return { cols: 4, rows: 15, perPage: 3 };
  if (questionCount <= 80) return { cols: 4, rows: 20, perPage: 2 };
  if (questionCount <= 100) return { cols: 4, rows: 25, perPage: 2 };
  if (questionCount <= 120) return { cols: 4, rows: 30, perPage: 1 };
  return { cols: 4, rows: 40, perPage: 1 };
}

/** Bitta varaqning oʻlchami, mm (`_pos()`, generator 231-258-satrlar).

    A4 = 210×297 mm, chekka 3 mm, varaqlar orasi 3 mm. */
export function getSheetSizeMm(perPage: number): { w: number; h: number } {
  const pageW = 210;
  const pageH = 297;
  const margin = 3;
  const gap = 3;
  const usableW = pageW - 2 * margin;
  const usableH = pageH - 2 * margin;

  if (perPage === 4) return { w: (usableW - gap) / 2, h: (usableH - gap) / 2 };
  if (perPage === 3) return { w: usableW, h: (usableH - 2 * gap) / 3 };
  if (perPage === 2) return { w: usableW, h: (usableH - gap) / 2 };
  return { w: usableW, h: usableH };
}

export type HeaderParams = {
  /** Sarlavha balandligi, mm. */
  hdrH: number;
  /** QR tomoni, mm. */
  qrSize: number;
  /** QR MARKAZI varaqning chap-yuqori burchagidan, mm. */
  qrOffX: number;
  qrOffY: number;
};

/** Sarlavha va QR oʻlchamlari (`_draw_sheet()`, generator 83-104-satrlar).

    Generator QR ni `(x + 2mm, hdr_bot + 0.5mm)` ga chizadi, yaʼni
    markazi varaq chap-yuqorisidan `(2 + qr/2, 0.5 + qr/2)` mm da
    boʻladi — quyidagi `qrOff*` aynan shu hisob. */
export function getHeaderParams(sheetHeightMm: number): HeaderParams {
  if (sheetHeightMm < 100) {
    return { hdrH: 18, qrSize: 16, qrOffX: 10, qrOffY: 9.5 };
  }
  return { hdrH: 22, qrSize: 20, qrOffX: 12, qrOffY: 11.5 };
}

/** Jadval oʻlchamlari — katak markazini topish uchun hamma narsa.

    Generatordagi hisob (`_draw_sheet` 133-153-satrlar) bir xilda
    takrorlanadi: marker kengligi 2.5 mm, qator balandligi eng koʻpi
    5.5 mm, katak radiusi uchta cheklovning eng kichigi. */
export function getTableMetrics(questionCount: number) {
  const layout = getLayout(questionCount);
  const dim = getSheetSizeMm(layout.perPage);
  const hdr = getHeaderParams(dim.h);

  const markerW = 2.5;
  const colW = (dim.w - 2 * markerW) / layout.cols;
  // Jadval balandligi: sarlavhadan pastki 1 mm chekkagacha.
  const tableH = dim.h - hdr.hdrH - 1;
  // `+1` — jadvalning oʻz sarlavha qatori (No. A B C D).
  const rowH = Math.min(tableH / (layout.rows + 1), 5.5);
  const bubbleR = Math.min(1.8, rowH * 0.32, (colW - 8) / 10);
  const optionSpacing = bubbleR * 2.8;

  return { layout, dim, hdr, markerW, colW, rowH, bubbleR, optionSpacing };
}

/* ── Varaqdagi QR ─────────────────────────────────────────────────── */

export type SheetQr = {
  testRef: number;
  classRef: number;
  studentRef: number;
  /** Ismsiz imtihon varagʻi (`class=0, student=0`). */
  examMode: boolean;
};

/** QR matnini oʻqiydi: `L{test},{class},{student}`.

    Ixcham format ataylab: QR Version 1 (21×21) ga sigʻadi va modullar
    yirik boʻladi — telefon kamerasi uzoqdan ham oʻqiydi. Eski JSON
    format (`{"t":..}`) hali bosilgan varaqlarda uchrashi mumkin,
    shuning uchun u ham qabul qilinadi. */
export function parseSheetQr(raw: string): SheetQr | null {
  if (!raw) return null;

  if (raw.charAt(0) === "L") {
    const parts = raw.substring(1).split(",");
    if (parts.length < 3) return null;
    const testRef = Number.parseInt(parts[0], 10);
    const classRef = Number.parseInt(parts[1], 10);
    const studentRef = Number.parseInt(parts[2], 10);
    if (Number.isNaN(testRef)) return null;
    return {
      testRef,
      classRef: Number.isNaN(classRef) ? 0 : classRef,
      studentRef: Number.isNaN(studentRef) ? 0 : studentRef,
      examMode: classRef === 0 && studentRef === 0,
    };
  }

  try {
    const obj = JSON.parse(raw) as { t?: number; c?: number; s?: number; m?: string };
    if (obj?.t === undefined) return null;
    return {
      testRef: obj.t,
      classRef: obj.c ?? 0,
      studentRef: obj.s ?? 0,
      examMode: obj.m === "e" || (!obj.c && !obj.s),
    };
  } catch {
    return null;
  }
}
