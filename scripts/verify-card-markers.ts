/* ════════════════════════════════════════════════════════════════════
   KARTA BELGILARINI TEKSHIRISH

   Ishga tushirish:  npx tsx scripts/verify-card-markers.ts

   Nega skript: karta bir marta chop etiladi va yillab ishlatiladi.
   Belgi mantigʻidagi xato bir necha oydan keyin — «nega Aliyevning
   bahosi Valiyevga tushdi?» degan savol bilan chiqadi va sababini
   topish deyarli imkonsiz. Shuning uchun kafolatlar OʻLCHANADI.

   Uchta xossa tekshiriladi:

     1. TOZA OʻQISH — har belgi, har burilishda aynan oʻz egasi va
        oʻz javobiga tushsin.
     2. XATOGA CHIDAM — 1-3 bit shikast tiklansin.
     3. XAVFSIZ RAD ETISH — ogʻir shikast (4-8 bit) NOTOʻGʻRI
        oʻquvchi bermasin. Rad etish yaxshi: oʻqituvchi kartani qayta
        koʻrsatadi. Notoʻgʻri oʻqish — boshqa bolaning jurnalidagi
        baho, va buni hech kim sezmaydi.

   Xossa buzilsa skript 1 bilan chiqadi.
   ════════════════════════════════════════════════════════════════════ */
import {
  MARKER_QUALITY,
  allRotations,
  markerForStudent,
  matchMarker,
} from "../src/lib/cards/marker";
import { buildAnswerCardsPdf } from "../src/lib/cards/card-pdf";
import { detectCards, makeDetectBuffers } from "../src/lib/cards/detect";
import { CvImage } from "../src/lib/omr/cv";

/** Deterministik generator — natija har ishga tushishda bir xil. */
function makeRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

let failed = false;
function check(label: string, ok: boolean, detail: string) {
  console.log(`${ok ? "✓" : "✗"} ${label} — ${detail}`);
  if (!ok) failed = true;
}

console.log("Lugʻat:", JSON.stringify(MARKER_QUALITY));

/* ── 1. Toza oʻqish ── */
{
  let ok = 0;
  let bad = 0;
  for (let no = 1; no <= MARKER_QUALITY.size; no++) {
    const bits = markerForStudent(no);
    if (bits === null) continue;
    allRotations(bits).forEach((rotated, rotation) => {
      const m = matchMarker(rotated);
      if (m && m.studentNo === no && m.rotation === rotation && m.corrected === 0) ok++;
      else bad++;
    });
  }
  check("toza oʻqish", bad === 0, `${ok} toʻgʻri, ${bad} xato`);
}

/* ── 2. Xatoga chidam (1 bit — amaldagi chegara) ── */
{
  const rnd = makeRandom(12345);
  let recovered = 0;
  let rejected = 0;
  let wrong = 0;
  for (let no = 1; no <= MARKER_QUALITY.size; no++) {
    for (let t = 0; t < 200; t++) {
      const bits = markerForStudent(no);
      if (bits === null) continue;
      const rotation = Math.floor(rnd() * 4);
      let damaged = allRotations(bits)[rotation];
      const flips = 1;
      const used = new Set<number>();
      for (let f = 0; f < flips; f++) {
        let b: number;
        do {
          b = Math.floor(rnd() * MARKER_QUALITY.bits);
        } while (used.has(b));
        used.add(b);
        damaged ^= 1 << b;
      }
      const m = matchMarker(damaged);
      if (!m) rejected++;
      else if (m.studentNo === no && m.rotation === rotation) recovered++;
      else wrong++;
    }
  }
  check(
    "1 bit shikast toʻliq tiklanadi",
    wrong === 0 && rejected === 0,
    `${recovered} tiklandi, ${rejected} rad etildi, ${wrong} NOTOʻGʻRI`
  );
}

/* ── 3. Ogʻir shikastda xavfsiz rad etish (4-8 bit) ── */
{
  const rnd = makeRandom(999);
  let recovered = 0;
  let rejected = 0;
  let wrong = 0;
  for (let no = 1; no <= MARKER_QUALITY.size; no++) {
    for (let t = 0; t < 300; t++) {
      const bits = markerForStudent(no);
      if (bits === null) continue;
      const rotation = Math.floor(rnd() * 4);
      let damaged = allRotations(bits)[rotation];
      const flips = 4 + Math.floor(rnd() * 5);
      const used = new Set<number>();
      for (let f = 0; f < flips; f++) {
        let b: number;
        do {
          b = Math.floor(rnd() * MARKER_QUALITY.bits);
        } while (used.has(b));
        used.add(b);
        damaged ^= 1 << b;
      }
      const m = matchMarker(damaged);
      if (!m) rejected++;
      else if (m.studentNo === no && m.rotation === rotation) recovered++;
      else wrong++;
    }
  }
  const wrongRate = (wrong / (MARKER_QUALITY.size * 300)) * 100;
  check(
    "4-8 bit ogʻir shikast xavfsiz rad etiladi",
    wrongRate < 0.05,
    `${recovered} tiklandi, ${rejected} xavfsiz rad etildi, ` +
      `${wrong} NOTOʻGʻRI (${wrongRate.toFixed(3)}% — ikki kadr kelishuvi bilan yoʻqoladi)`
  );
}

/* ── 4. Tasodifiy shovqin karta deb oʻqilmasin ── */
{
  const rnd = makeRandom(4242);
  let accepted = 0;
  const trials = 50_000;
  for (let t = 0; t < trials; t++) {
    const noise = Math.floor(rnd() * (1 << MARKER_QUALITY.bits));
    if (matchMarker(noise)) accepted++;
  }
  const rate = (accepted / trials) * 100;
  check(
    "tasodifiy shovqin",
    rate < 0.1,
    `${trials} tasodifiy naqshdan ${accepted} tasi karta deb qabul qilindi (${rate.toFixed(3)}%)`
  );
}

/* ── 5. PDF chizilishi ── */
async function checkPdf() {
  const students = Array.from({ length: 33 }, (_, i) => ({
    no: i + 1,
    name: `Oʻquvchi Familiya ${i + 1}`,
  }));
  const pdf = await buildAnswerCardsPdf({ students, className: "10-A" });
  check(
    "PDF chizildi",
    pdf.bytes.length > 5000 && pdf.skipped.length === 0,
    `${(pdf.bytes.length / 1024).toFixed(0)} KB, sigʻmagan: ${pdf.skipped.length}`
  );

  const over = await buildAnswerCardsPdf({
    students: Array.from({ length: MARKER_QUALITY.size + 7 }, (_, i) => ({
      no: i + 1,
      name: `X${i + 1}`,
    })),
    className: "katta sinf",
  });
  check(
    "lugʻatdan oshgan sinf",
    over.skipped.length === 7,
    `${over.skipped.length} oʻquvchi ochiq oʻtkazib yuborildi (takroriy karta berilmadi)`
  );
}



/* ── 6. ANIQLAGICH: sunʼiy «sinf surati» dan oʻqish ────────────────

   Kamera bilan sinab boʻlmagani uchun kadr QOʻLDA quriladi: oq fonga
   bir necha karta belgisi turli burilishda va turli oʻlchamda
   chiziladi, keyin `detectCards()` oʻsha kadrdan oʻqiydi.

   Bu haqiqiy suratning oʻrnini bosmaydi (yorugʻlik, qiyshiqlik,
   fokus yoʻq), lekin quvurni uchidan uchigacha tekshiradi: kontur →
   toʻrtburchak → warp → ramka → bitlar → lugʻat. Bu zanjirdagi xato
   shu yerda ushlanadi. */
function checkDetector() {
  const W = 640;
  const H = 480;
  const gray = new CvImage(W, H, new Uint8Array(W * H).fill(255));

  /** Belgini kadrga chizadi.

      Burilgan bitlar `allRotations()` dan OLINADI — bu yerda qoʻlda
      indeks aylantirish qilinmaydi. Birinchi urinishda aynan shu
      xato boʻlgan edi: teskari yoʻnalishda aylantirilgani uchun toq
      burilishlar (1 va 3) oʻrin almashib, aniqlagich ayibdor
      koʻringandi. Bitta manbadan olish — sinov ham, kod ham bir xil
      taʼrifga tayanadi. */
  function paint(bits: number, x0: number, y0: number, size: number, rotation: number) {
    const rotated = allRotations(bits)[rotation];
    const cells = MARKER_QUALITY.grid + 2;
    const cell = size / cells;
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        const border = r === 0 || c === 0 || r === cells - 1 || c === cells - 1;
        const dark =
          border ||
          (rotated & (1 << ((r - 1) * MARKER_QUALITY.grid + (c - 1)))) !== 0;
        if (!dark) continue;
        const px0 = Math.round(x0 + c * cell);
        const py0 = Math.round(y0 + r * cell);
        const px1 = Math.round(x0 + (c + 1) * cell);
        const py1 = Math.round(y0 + (r + 1) * cell);
        for (let y = py0; y < py1; y++) {
          for (let x = px0; x < px1; x++) {
            if (x >= 0 && y >= 0 && x < W && y < H) gray.data[y * W + x] = 0;
          }
        }
      }
    }
  }

  const expected = [
    { no: 1, rotation: 0, x: 20, y: 20, size: 120 },
    { no: 7, rotation: 1, x: 200, y: 30, size: 100 },
    { no: 23, rotation: 2, x: 380, y: 40, size: 90 },
    { no: 42, rotation: 3, x: 60, y: 240, size: 140 },
    { no: 63, rotation: 1, x: 300, y: 260, size: 110 },
  ];
  for (const e of expected) {
    const bits = markerForStudent(e.no);
    if (bits !== null) paint(bits, e.x, e.y, e.size, e.rotation);
  }

  const buffers = makeDetectBuffers(W, H);
  const found = detectCards(gray, buffers, { minEdgePx: 40 });

  const byNo = new Map(found.map((f) => [f.match.studentNo, f.match]));
  const missing = expected.filter((e) => !byNo.has(e.no));
  const wrongRotation = expected.filter(
    (e) => byNo.has(e.no) && byNo.get(e.no)!.rotation !== e.rotation
  );
  const extra = found.filter((f) => !expected.some((e) => e.no === f.match.studentNo));

  check(
    "aniqlagich — sunʼiy kadr",
    missing.length === 0 && wrongRotation.length === 0 && extra.length === 0,
    `${found.length}/${expected.length} topildi · topilmagan: ${missing.map((m) => m.no).join(",") || "yoʻq"}` +
      ` · burilish xato: ${wrongRotation.map((m) => m.no).join(",") || "yoʻq"}` +
      ` · ortiqcha: ${extra.length}`
  );
}

checkDetector();
checkPdf().then(() => process.exit(failed ? 1 : 0));
