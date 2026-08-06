import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import {
  GRID_WITH_BORDER,
  MARKER_CAPACITY,
  MARKER_GRID,
  isCellFilled,
  markerForStudent,
} from "./marker";

/* ════════════════════════════════════════════════════════════════════
   JAVOB KARTALARI — chop etiladigan PDF

   Plickers naqshi: har oʻquvchida bitta karta. Savol berilganda bola
   kartani BURAB koʻtaradi — yuqoriga qaragan tomondagi harf uning
   javobi. Oʻqituvchi butun sinfni bitta suratga oladi.

   Telefonsiz sinf uchun yagona ishlaydigan usul: bolada qurilma
   kerak emas, faqat bitta qogʻoz.

   ── DIZAYN QARORLARI ────────────────────────────────────────────────

   Har bir oʻlcham «uzoqdan oʻqilishi» talabidan kelib chiqqan.
   Oʻqituvchi sinf oldida turadi, orqa parta 6-7 metrda; kartaning
   kadrdagi kengligi ~40 pikselgacha tushadi.

   • Belgi kartaning KATTA qismini egallaydi (~64 mm). Ism va harflar
     — qolgan joyda. Aksincha qilinsa (chiroyli katta ism, kichkina
     belgi) karta uzoqdan oʻqilmaydi.

   • Belgi atrofida OQ zaxira bor. Aniqlagich qora ramkani fon bilan
     ajratishi kerak; karta chetigacha qora boʻlsa, qora stol yoki
     forma yoqasi bilan qoʻshilib ketadi.

   • Harflar toʻrt tomonda, HAR BIRI oʻz tomoniga qarab burilgan.
     Bola kartani burab, tepaga chiqqan harfni koʻradi. Bu Plickers
     bilan bir xil va oʻrgatishga vaqt ketmaydi.

   • Karta orqasiga hech narsa bosilmaydi: bir tomonlama chop etish
     arzon va maktab printerida chalkashlik boʻlmaydi.

   ⚠️ Kartadagi belgi — `marker-dictionary.ts` dagi MUZLATILGAN
   lugʻatdan. Lugʻat oʻzgarsa chop etilgan kartalar yaroqsiz boʻladi.
   ════════════════════════════════════════════════════════════════════ */

/** A4, mm. */
const PAGE_W = 210;
const PAGE_H = 297;
/** Sahifada 2×2 = 4 ta karta. Kartani qoʻlda ushlash uchun kattaroq
    qilib boʻlmaydi (A5 dan katta karta bola qoʻlida qaltiraydi), 6 ta
    qilinsa belgi kichrayib uzoqdan oʻqilmay qoladi. */
const COLS = 2;
const ROWS = 2;
const MARGIN = 8;
const GAP = 6;

const MM = 72 / 25.4; // mm → PDF punkti

export type CardStudent = { no: number; name: string };

export type CardsResult = { bytes: Uint8Array; filename: string; skipped: CardStudent[] };

/** Sinf uchun kartalar PDF'i.

    Lugʻatga sigʻmagan oʻquvchilar `skipped` da qaytariladi —
    chaqiruvchi buni oʻqituvchiga aytadi. Takroriy belgi berish
    (ikki bolaga bir xil karta) mumkin emas: baho notoʻgʻri odamga
    tushardi va buni hech kim sezmasdi. */
export async function buildAnswerCardsPdf(input: {
  students: CardStudent[];
  className: string;
}): Promise<CardsResult> {
  const pdf = await PDFDocument.create();
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  const usableW = PAGE_W - 2 * MARGIN;
  const usableH = PAGE_H - 2 * MARGIN;
  const cardW = (usableW - (COLS - 1) * GAP) / COLS;
  const cardH = (usableH - (ROWS - 1) * GAP) / ROWS;

  const skipped: CardStudent[] = [];
  const printable = input.students.filter((s) => {
    if (markerForStudent(s.no) === null) {
      skipped.push(s);
      return false;
    }
    return true;
  });

  const perPage = COLS * ROWS;
  const pageCount = Math.max(1, Math.ceil(printable.length / perPage));

  for (let p = 0; p < pageCount; p++) {
    const page = pdf.addPage([PAGE_W * MM, PAGE_H * MM]);
    for (let i = 0; i < perPage; i++) {
      const student = printable[p * perPage + i];
      if (!student) break;
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      // PDF koordinatasi pastdan boshlanadi — yuqoridan sanaymiz.
      const x = MARGIN + col * (cardW + GAP);
      const y = PAGE_H - MARGIN - (row + 1) * cardH - row * GAP;
      drawCard({
        page,
        font,
        fontBold,
        x,
        y,
        w: cardW,
        h: cardH,
        student,
        className: input.className,
      });
    }
  }

  const bytes = await pdf.save();
  return {
    bytes,
    filename: `javob-kartalari-${slug(input.className)}.pdf`,
    skipped,
  };
}

type DrawArgs = {
  page: ReturnType<PDFDocument["addPage"]>;
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  fontBold: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  x: number;
  y: number;
  w: number;
  h: number;
  student: CardStudent;
  className: string;
};

function drawCard({ page, font, fontBold, x, y, w, h, student, className }: DrawArgs) {
  const bits = markerForStudent(student.no);
  if (bits === null) return;

  const black = rgb(0, 0, 0);
  const grey = rgb(0.45, 0.45, 0.45);

  // Kesish chizigʻi — ingichka kulrang, qaychi uchun.
  page.drawRectangle({
    x: x * MM,
    y: y * MM,
    width: w * MM,
    height: h * MM,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 0.5,
  });

  /* Belgi oʻlchami: kartaning ichki maydonidan harflar va ism uchun
     joy ayirib qolgani. Kvadrat boʻlishi shart — chizilgan belgi
     choʻzilsa, oʻqishda burchak notoʻgʻri hisoblanadi. */
  const letterBand = 9; // harf uchun har tomondan
  const nameBand = 9; // pastda ism uchun
  const markerBox = Math.min(w - 2 * letterBand - 4, h - 2 * letterBand - nameBand - 4);
  const markerX = x + (w - markerBox) / 2;

  /* Belgi markazga emas, TEPAROQQA joylashtiriladi.

     Karta eni bilan cheklangan (belgi kvadrat), shuning uchun pastda
     boʻsh joy ortadi. Uni ataylab pastga qoldiramiz: bola kartani
     aynan pastidan ushlaydi va barmoqlari belgini toʻsmaydi. Markazga
     qoʻyilsa barmoq pastki qatorga tegib, oʻqish buzilardi. */
  const slack = h - nameBand - markerBox - 2 * letterBand;
  const markerY = y + nameBand + letterBand + Math.max(0, slack) * 0.7;

  drawMarker(page, bits, markerX, markerY, markerBox);

  /* Toʻrt tomondagi harflar. Har biri OʻZ tomoniga qarab burilgan:
     bola kartani burab, tepaga chiqqan harfni oʻqiydi. Burilish
     tartibi `ROTATION_ANSWERS` bilan bir xil — A tepada, keyin soat
     yoʻnalishida. */
  const cx = x + w / 2;
  const cy = markerY + markerBox / 2;
  const size = 13;
  const arm = markerBox / 2 + 5.5;

  drawLetter(page, fontBold, "A", cx, cy + arm, size, 0, black);
  drawLetter(page, fontBold, "B", cx + arm, cy, size, 270, black);
  drawLetter(page, fontBold, "C", cx, cy - arm, size, 180, black);
  drawLetter(page, fontBold, "D", cx - arm, cy, size, 90, black);

  // Ism va raqam — pastda, oʻqituvchi tarqatishda ajratsin uchun.
  const label = safeLabel(`${student.no}. ${student.name}`);
  const labelSize = 9;
  const labelW = fontBold.widthOfTextAtSize(label, labelSize) / MM;
  page.drawText(label, {
    x: (x + (w - labelW) / 2) * MM,
    y: (y + 4.5) * MM,
    size: labelSize,
    font: fontBold,
    color: black,
  });

  const sub = safeLabel(className);
  const subSize = 6.5;
  const subW = font.widthOfTextAtSize(sub, subSize) / MM;
  page.drawText(sub, {
    x: (x + (w - subW) / 2) * MM,
    y: (y + 1.2) * MM,
    size: subSize,
    font,
    color: grey,
  });
}

/** Belgi — qora ramka + 5×5 katak.

    Ramka QOP-QORA va butun aylana boʻylab uzluksiz: aniqlagich aynan
    shu toʻrtburchakni qidiradi. Ichki kataklar oq fonda qora
    kvadratchalar. */
function drawMarker(
  page: DrawArgs["page"],
  bits: number,
  x: number,
  y: number,
  size: number
) {
  const cell = size / GRID_WITH_BORDER;
  const black = rgb(0, 0, 0);

  // Oq zamin — karta fonidan ajratadi.
  page.drawRectangle({
    x: x * MM,
    y: y * MM,
    width: size * MM,
    height: size * MM,
    color: rgb(1, 1, 1),
  });

  // Qora ramka: toʻrtta toʻgʻri toʻrtburchak (chiziq emas — chiziq
  // qalinligi printerda oʻzgaruvchan, toʻldirilgan shakl aniq).
  page.drawRectangle({ x: x * MM, y: y * MM, width: size * MM, height: cell * MM, color: black });
  page.drawRectangle({
    x: x * MM,
    y: (y + size - cell) * MM,
    width: size * MM,
    height: cell * MM,
    color: black,
  });
  page.drawRectangle({ x: x * MM, y: y * MM, width: cell * MM, height: size * MM, color: black });
  page.drawRectangle({
    x: (x + size - cell) * MM,
    y: y * MM,
    width: cell * MM,
    height: size * MM,
    color: black,
  });

  /* Kataklar. Qator 0 — YUQORIDA (oʻqish tomonida ham shunday),
     PDF esa pastdan sanaydi, shuning uchun `y` teskari hisoblanadi.
     Bu ikki tomonda bir xil boʻlishi SHART: aks holda karta 180°
     burilgandek oʻqilardi. */
  for (let r = 0; r < MARKER_GRID; r++) {
    for (let c = 0; c < MARKER_GRID; c++) {
      if (!isCellFilled(bits, r, c)) continue;
      const cellX = x + (c + 1) * cell;
      const cellY = y + size - (r + 2) * cell;
      page.drawRectangle({
        x: cellX * MM,
        y: cellY * MM,
        width: cell * MM,
        height: cell * MM,
        color: black,
      });
    }
  }
}

/** Harfni oʻz tomoniga qaratib chizadi (markazi berilgan nuqtada). */
function drawLetter(
  page: DrawArgs["page"],
  font: DrawArgs["font"],
  text: string,
  cx: number,
  cy: number,
  size: number,
  rotation: number,
  color: ReturnType<typeof rgb>
) {
  const wMm = font.widthOfTextAtSize(text, size) / MM;
  const hMm = size / MM;
  // Burilgan matnda pdf-lib boshlangʻich nuqtani buradi — markazni
  // saqlash uchun siljishni qoʻlda hisoblaymiz.
  const rad = (rotation * Math.PI) / 180;
  const dx = (-wMm / 2) * Math.cos(rad) + (hMm / 2.8) * Math.sin(rad);
  const dy = (-wMm / 2) * Math.sin(rad) - (hMm / 2.8) * Math.cos(rad);
  page.drawText(text, {
    x: (cx + dx) * MM,
    y: (cy + dy) * MM,
    size,
    font,
    color,
    rotate: degrees(rotation),
  });
}

/* ── Ismni chizishga tayyorlash ────────────────────────────────────

   PDF standart shriftlari (Helvetica) WinAnsi kodlashda ishlaydi va
   oʻzbekcha `ʻ` (U+02BB) ni CHIZA OLMAYDI — «Gʻulomov», «Toʻlqin»,
   «Saʼdulla» kabi ismlarda dastur otib tushardi. Bu prodda birinchi
   kundayoq chiqadigan xato edi.

   Ikki yechim bor edi:

     • Unicode shriftini (≈500 KB) repoga qoʻshib fontkit bilan ulash;
     • ismni WinAnsi ga xavfsiz oʻgirish.

   Ikkinchisi tanlandi. Sabab — KARTADA ISM SHUNCHAKI YORLIQ:
   oʻqituvchi kartalarni tarqatishda oʻqiydi, xolos. Kimligini BELGI
   tashiydi. Yaʼni `ʻ` → `'` boʻlgani hech qachon notoʻgʻri bahoga
   olib kelmaydi, 500 KB shrift esa har karta soʻrovida yuklanardi.

   Kirill alifbosi ham oʻgiriladi: oʻqituvchi ismlarni kirillda
   kiritgan boʻlishi mumkin, va boʻsh karta olishdan koʻra
   transliteratsiya afzal. */

/** Oʻzbekcha tutuq/qattiqlik belgilarining barcha koʻrinishlari. */
const APOSTROPHES = /[ʻʼ‘’`´']/g;

const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "x", ц: "ts", ч: "ch", ш: "sh",
  щ: "sh", ъ: "'", ы: "i", ь: "", э: "e", ю: "yu", я: "ya",
  ў: "o'", қ: "q", ғ: "g'", ҳ: "h",
};

function transliterate(value: string): string {
  let out = "";
  for (const ch of value) {
    const lower = ch.toLowerCase();
    const mapped = CYRILLIC[lower];
    if (mapped === undefined) {
      out += ch;
      continue;
    }
    // Bosh harf boʻlsa natijaning birinchi harfi ham bosh boʻlsin.
    out += ch === lower ? mapped : mapped.charAt(0).toUpperCase() + mapped.slice(1);
  }
  return out;
}

/** Standart shrift chiza oladigan holatga keltiradi. */
export function safeLabel(value: string): string {
  const converted = transliterate(value).replace(APOSTROPHES, "'");
  // Qolgan chizib boʻlmaydigan belgilar tashlanadi — nom butunlay
  // yoʻqolsa ham karta chiqadi, chunki tepasida raqami bor.
  return converted.replace(/[^ -ÿ]/g, "").trim();
}

function slug(value: string): string {
  return (
    safeLabel(value)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "sinf"
  );
}

export { MARKER_CAPACITY };
