/* ════════════════════════════════════════════════════════════════════
   DOSKA «Rangli shakllar» FONI — generator.

       node scripts/doska-shakllar.mjs

   stdout ga <use> qatorlarini beradi, stderr ga esa hisobot (nuqta
   soni, min masofa, palitra, min dE). Natija
   `src/lib/doska/backgrounds.ts` dagi `shakllar` fonining <use>
   blokiga koʻchiriladi — u yerdagi izohda nima uchun aynan shunday
   qilingani batafsil yozilgan.

   Nega generator kerak: joylashuv Poisson-disk (blue noise), palitra
   esa OKLab da optimallanadi. Ikkalasini ham qoʻlda yozib boʻlmaydi,
   va qoʻlda «tasodifiy» yozilgani panjara boʻlib koʻrindi.

   ⚠️ PRNG urugʻi qatʼiy (mulberry32(20260826)) — skript har safar
   AYNAN bir xil natija beradi. Naqshni yangilash kerak boʻlsa urugʻni
   almashtiring, aks holda diff shovqin boʻlib ketadi.
   ════════════════════════════════════════════════════════════════════ */

const SIZE = 800;
const R = 70; // minimal masofa (blue noise radiusi)
const K = 30; // Bridson urinishlar soni

/* ── Seeded PRNG (mulberry32) — natija qayta ishlab chiqarilishi uchun ── */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260826);

/* ── Torda (torus) masofa: tile chetlari bir-biriga ulanadi ── */
function torDist(ax, ay, bx, by) {
  let dx = Math.abs(ax - bx), dy = Math.abs(ay - by);
  if (dx > SIZE / 2) dx = SIZE - dx;
  if (dy > SIZE / 2) dy = SIZE - dy;
  return Math.hypot(dx, dy);
}

/* ── Bridson Poisson-disk sampling, toroidal ── */
function poisson() {
  const cell = R / Math.SQRT2;
  const gw = Math.ceil(SIZE / cell);
  const grid = new Array(gw * gw).fill(-1);
  const pts = [];
  const active = [];
  const gi = (x, y) => ((Math.floor(y / cell) % gw) + gw) % gw * gw + (((Math.floor(x / cell) % gw) + gw) % gw);

  const add = (x, y) => { grid[gi(x, y)] = pts.length; pts.push([x, y]); active.push(pts.length - 1); };
  add(rnd() * SIZE, rnd() * SIZE);

  const ok = (x, y) => {
    const cx = Math.floor(x / cell), cy = Math.floor(y / cell);
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
      const idx = grid[(((cy + j) % gw) + gw) % gw * gw + ((((cx + i) % gw) + gw) % gw)];
      if (idx >= 0 && torDist(x, y, pts[idx][0], pts[idx][1]) < R) return false;
    }
    return true;
  };

  while (active.length) {
    const ai = Math.floor(rnd() * active.length);
    const [px, py] = pts[active[ai]];
    let placed = false;
    for (let t = 0; t < K; t++) {
      const ang = rnd() * Math.PI * 2;
      const rad = R * (1 + rnd());
      const x = ((px + Math.cos(ang) * rad) % SIZE + SIZE) % SIZE;
      const y = ((py + Math.sin(ang) * rad) % SIZE + SIZE) % SIZE;
      if (ok(x, y)) { add(x, y); placed = true; break; }
    }
    if (!placed) active.splice(ai, 1);
  }
  return pts;
}

/* ── OKLCH → sRGB hex: bir xil idrok yorqinligidagi 16 ta rang ── */
/* `probe=true` bo'lsa: gamutga sig'sa true, sig'masa false qaytaradi.
   Aks holda hex qaytaradi (chegaradan chiqqani qirqiladi). */
function oklchToHex(L, C, Hdeg, probe = false) {
  const h = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const inGamut = lin.every((v) => v >= -0.0005 && v <= 1.0005);
  if (probe) return inGamut;
  return (
    "#" +
    lin
      .map((v) => Math.min(1, Math.max(0, v)))
      .map((v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055))
      .map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0"))
      .join("")
  );
}

/* Shakl kodlari — har biriga o'z hue'si biriktiriladi (1:1).
   12 ta: kategorik palitraning idrok chegarasi (ColorBrewer/Tableau). */
const SHAPES = ["t", "s", "d", "x", "c", "r", "p", "w", "o", "h", "a", "l"];

/* ── hex → OKLab (idrok masofasini o'lchash uchun) ── */
function hexToOklab(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.substr(i, 2), 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
const dE = (A, B) => Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);

/* ── Hue'larni IDROK fazosida optimallash ─────────────────────────
   Teng 30° qadam matematik jihatdan teng, idrok jihatidan EMAS:
   ko'k-zangori sohada 30° arzimas farq beradi, qizil-sariqda esa
   katta. Shuning uchun hue'lar koordinatali tushish (coordinate
   descent) bilan siljitiladi — maqsad eng yaqin juftlikning OKLab
   masofasini MAKSIMALLASHTIRISH (maximin). Gamut cheklovi ham
   hisobga olinadi: har hue avval haqiqiy sRGB rangga aylantiriladi,
   masofa esa o'sha CHIQQAN rang bo'yicha o'lchanadi. */
/* ⚠️ TO'YINGANLIK QURBON QILINMASIN. Avvalgi urinishda C qat'iy
   0.17 edi va L 0.86 gacha ko'tarildi — sRGB'da yuqori yorqinlik
   to'yinganlikni siqadi, natijada palitra PASTEL bo'lib qoldi.
   Endi har (L, hue) uchun gamutga sig'adigan ENG KATTA C olinadi
   (binary search), ya'ni rang har doim gamut chegarasida — eng
   to'yingan holatda turadi.

   Bu ajratishga ham foyda: gamut chegarasidagi ranglar markazga
   yaqinlaridan ko'ra bir-biridan tabiiy uzoqroq. */
/* Yorqinlik CHEGARASI emas, CHROMA POLI himoya qiladi.
   ⚠️ Quyi chegara kerak: L=0.56 dagi yashil to'q va loyqa chiqdi.
   ⚠️ Yuqori chegarani esa 0.82 da ushlab turish XATO edi — sariq va
   to'q sariq sRGB'da faqat baland L da jonli bo'ladi (sof sariq
   L≈0.97), 0.82 shipi ularni jigarrang/zaytunga aylantirdi.
   Shipni ko'tarish avval xavfli edi (L=0.90 da ko'k chroma'si 0.049
   ga tushib deyarli OQ bo'lgandi), lekin C_FLOOR aynan shuni
   to'sadi: baland L faqat u yerda ham to'yingan qoladigan hue'larga
   (sariq/yashil) ruxsat etiladi. */
const L_MIN = 0.62, L_MAX = 0.92, L_STEP = 0.02;
/* Chroma poli — bundan past rang «yuvilgan» ko'rinadi.
   Bu TO'YINGANLIK ↔ AJRATISH almashuvining tugmasi; o'lchangan:

     pol    min dE   o'rtacha C   natija
     0.14   0.145    0.184        h zaytun, d jigarrang
     0.16   0.102    0.198        h jonli sariq, d amber, w sof qizil  ← tanlandi
     0.18   0.089    0.195        dE chegaradan tushdi, C o'smadi
     0.20   0.089    0.212        dE chegaradan tushdi

   0.18 dan yuqorisi bekor: eng past chroma 0.159 da qotib qoladi
   (gamut cheklovi), dE esa 0.10 chegarasidan tushib ketadi.
   0.16 tanlandi — dE hali chegaradan yuqori, palitra esa sezilarli
   jonli. Buni oqlaydigan narsa: bu yerda rang IKKILAMCHI belgi,
   asosiy farqlovchi — shakl. */
const C_FLOOR = Number(process.env.C_FLOOR ?? 0.16);
const cache = new Map();
/* Berilgan L va hue uchun gamutdagi maksimal chroma. */
function maxChromaHex(L, h) {
  let lo = 0, hi = 0.45;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (oklchToHex(L, mid, h, true)) lo = mid; else hi = mid;
  }
  return { hex: oklchToHex(L, lo, h), C: lo };
}
/* ⚠️ hex va C bitta lazy-fill orqali olinadi. Avval `pickC` to'g'ridan
   keshdan o'qirdi va `score()` uni `pick()` dan OLDIN chaqirgani uchun
   kesh bo'sh bo'lib, undefined.C bilan yiqilardi. */
const entry = (L, h) => {
  const k = `${L.toFixed(2)}|${((Math.round(h) % 360) + 360) % 360}`;
  if (!cache.has(k)) cache.set(k, maxChromaHex(L, h));
  return cache.get(k);
};
const pick = (L, h) => entry(L, h).hex;
const pickC = (L, h) => entry(L, h).C;
const minPair = (cs) => {
  const labs = cs.map((c) => hexToOklab(pick(c.L, c.h)));
  let m = Infinity;
  for (let i = 0; i < labs.length; i++)
    for (let j = i + 1; j < labs.length; j++) m = Math.min(m, dE(labs[i], labs[j]));
  return m;
};
/* ⚠️ Chroma poli QATTIQ rad etish bo'lmasin. Avval shunday qilingandi
   (pol buzilsa -Infinity) va optimizator umuman ishlamadi: boshlang'ich
   nuqta ham polni buzardi, har qanday harakat ham -Infinity qaytarardi,
   demak «yaxshilanish» hech qachon topilmadi. Yumshoq jarima esa
   yaroqsiz hududdan yaroqli hudud tomon YO'L ko'rsatadi. */
const score = (cs) => {
  const pen = cs.reduce((a, c) => a + Math.max(0, C_FLOOR - pickC(c.L, c.h)), 0);
  return minPair(cs) - 10 * pen;
};
/* ⚠️ Hue SEKTORDAN chiqmasin (±14°). Erkin qoldirilsa optimizator
   sof maximin uchun hue'larni sRGB gamut kengroq bo'lgan yashil-
   zangori sohaga tiqadi va binafsha/pushti butunlay yo'qoladi —
   sinovda aynan shunday bo'ldi. Sektor cheklovi rangin-kamalak
   qamrovini saqlaydi, ajratishni esa YORQINLIK zimmasiga yuklaydi.
   Sektorlar shakllarga ×7 siljish bilan beriladi (7 va 12 o'zaro
   tub): ro'yxatda yonma-yon turgan shakllar qo'shni hue olmaydi. */
const SLOT = SHAPES.map((_, i) => ((i * 7) % SHAPES.length) * (360 / SHAPES.length) + 15);
const H_SPAN = 14;
const cols = SLOT.map((h) => ({ h, L: 0.76 }));
const before = minPair(cols);
for (let pass = 0; pass < 12; pass++) {
  let improved = false;
  for (let i = 0; i < cols.length; i++) {
    let best = { ...cols[i] }, bestScore = score(cols);
    for (let dh = -H_SPAN; dh <= H_SPAN; dh += 1)
      for (let L = L_MIN; L <= L_MAX + 1e-9; L += L_STEP) {
        const h = SLOT[i] + dh;
        cols[i] = { h, L };
        const sc = score(cols);
        if (sc > bestScore + 1e-6) { bestScore = sc; best = { h, L }; improved = true; }
      }
    cols[i] = best;
  }
  if (!improved) break;
}
const chromas = cols.map((c) => pickC(c.L, c.h));
console.error(`palitra optimizatsiyasi: min dE ${before.toFixed(3)} -> ${minPair(cols).toFixed(3)}`);
console.error(
  `chroma: o'rtacha ${(chromas.reduce((a, b) => a + b) / chromas.length).toFixed(3)}` +
    ` | eng past ${Math.min(...chromas).toFixed(3)} | eng baland ${Math.max(...chromas).toFixed(3)}`,
);
console.error(
  `yorqinlik: ${Math.min(...cols.map((c) => c.L)).toFixed(2)} .. ${Math.max(...cols.map((c) => c.L)).toFixed(2)}`,
);

const COLOR = {};
SHAPES.forEach((sh, i) => { COLOR[sh] = pick(cols[i].L, cols[i].h); });

/* Burilish chegarasi — har shakl uchun alohida.
   ⚠️ Kvadrat 45° burilsa ROMB bo'ladi, X esa PLYUS bo'ladi: bu ikki
   juftlik uchun burilish qat'iy cheklanadi, aks holda ikki xil shakl
   bir xil ko'rinadi va 1:1 rang tizimi buziladi. */
const ROT = { t: 22, s: 12, d: 30, x: 15, c: 360, r: 12, p: 22, w: 12, o: 0, h: 15, a: 22, l: 15 };

const pts = poisson();

/* ── Shakl biriktirish: yaqin atrofda bir xil shakl (=rang) bo'lmasin ── */
const SEP = 210;
const used = Object.fromEntries(SHAPES.map((s) => [s, 0]));
const assigned = [];
for (const [x, y] of pts) {
  const near = new Set(
    assigned.filter((a) => torDist(x, y, a.x, a.y) < SEP).map((a) => a.sh),
  );
  const pool = SHAPES.filter((s) => !near.has(s));
  const cands = (pool.length ? pool : SHAPES).slice();
  cands.sort((a, b) => used[a] - used[b] || rnd() - 0.5);
  const sh = cands[0];
  used[sh]++;
  const cap = ROT[sh];
  const rot = cap === 360 ? Math.round(rnd() * 360) : Math.round((rnd() * 2 - 1) * cap);
  assigned.push({ x, y, sh, rot });
}

/* ── Chokni yo'qotish: qirrani kesib o'tuvchi shakl qarama-qarshi
   tomonda ham chizilishi kerak, aks holda tile chegarasi ko'rinadi. ── */
const EXT = 13; // eng katta shaklning yarim o'lchami + chiziq
const out = [];
for (const a of assigned) {
  const xs = [0], ys = [0];
  if (a.x < EXT) xs.push(SIZE); else if (a.x > SIZE - EXT) xs.push(-SIZE);
  if (a.y < EXT) ys.push(SIZE); else if (a.y > SIZE - EXT) ys.push(-SIZE);
  for (const dx of xs) for (const dy of ys) {
    const X = Math.round(a.x + dx), Y = Math.round(a.y + dy);
    const rot = a.rot ? ` rotate(${a.rot})` : "";
    out.push(`          <use href='#${a.sh}' color='${COLOR[a.sh]}' transform='translate(${X},${Y})${rot}'/>`);
  }
}

/* ── Hisobot ── */
let min = Infinity;
for (let i = 0; i < pts.length; i++)
  for (let j = i + 1; j < pts.length; j++)
    min = Math.min(min, torDist(pts[i][0], pts[i][1], pts[j][0], pts[j][1]));
console.error(`nuqta: ${pts.length} | use: ${out.length} | min masofa: ${min.toFixed(1)}px (R=${R})`);
console.error(`o'rtacha oraliq: ${Math.sqrt((SIZE * SIZE) / pts.length).toFixed(0)}px`);
console.error("shakl taqsimoti: " + SHAPES.map((s) => `${s}:${used[s]}`).join(" "));
console.error("palitra:");
SHAPES.forEach((s) => console.error(`  ${s} -> ${COLOR[s]}`));
console.log(out.join("\n"));
