import type { CSSProperties } from "react";

/* ════════════════════════════════════════════════════════════════════
   DOSKA FONLARI — sof CSS, rasm YOʻQ.

   Sabab: classroomscreen 100+ JPG fon saqlaydi (bir necha megabayt
   deploy yuki), ular esa projektorda pikselli chiqadi. CSS fon istalgan
   oʻlchamda toza va deploy yukiga hech narsa qoʻshmaydi. Foydalanuvchi
   oʻz rasmini yuklashi keyingi bosqichda — bizning katalogimiz JPG
   bilan ogʻirlashmaydi.

   ⚠️ `tone` — shunchaki yorliq emas, RENDER QAROR: toʻq fon ustida
   vidjetlar «bo'r rejimi»ga oʻtadi (kanvasdagi `data-bg-tone`, tuslar
   globals.css da qayta belgilanadi). Vidjet komponentlari bundan
   bexabar — ular baribir `var(--doska-*-bg)` ni oʻqiydi.
   ════════════════════════════════════════════════════════════════════ */

export type BackgroundTone = "light" | "dark";

export type DoskaBackground = {
  id: string;
  label: string;
  tone: BackgroundTone;
  style: CSSProperties;
  /** Doska teksturasi — yengil shovqin qatlami (faqat toʻq fonlarda). */
  grain?: boolean;
};

export const DOSKA_BACKGROUNDS: DoskaBackground[] = [
  {
    id: "chalkboard-green",
    label: "Yashil doska",
    tone: "dark",
    grain: true,
    style: { background: "oklch(0.33 0.045 158)" },
  },
  {
    id: "chalkboard-black",
    label: "Qora doska",
    tone: "dark",
    grain: true,
    style: { background: "oklch(0.22 0.008 250)" },
  },
  {
    id: "whiteboard",
    label: "Oq taxta",
    tone: "light",
    style: { background: "oklch(0.97 0.002 250)" },
  },
  {
    id: "grid-paper",
    label: "Katak daftar",
    tone: "light",
    style: {
      backgroundColor: "oklch(0.99 0.006 90)",
      backgroundImage:
        "linear-gradient(oklch(0.85 0.035 240) 1px, transparent 1px), linear-gradient(90deg, oklch(0.85 0.035 240) 1px, transparent 1px)",
      backgroundSize: "44px 44px",
    },
  },
  {
    id: "dot-paper",
    label: "Nuqtali qogʻoz",
    tone: "light",
    style: {
      backgroundColor: "oklch(0.98 0.004 90)",
      backgroundImage: "radial-gradient(oklch(0.8 0.008 90) 2px, transparent 2px)",
      backgroundSize: "36px 36px",
    },
  },
  {
    /**
     * Chiziqli daftar — yozuv mashqi, ona tili, imlo uchun.
     * Ikki qatlam: chapdan 50px joyda qizil chekka chizigʻi (vertikal)
     * va har 30px da kulrang qator (gorizontal).
     *
     * ⚠️ `backgroundSize` ikkala qatlamga ham tegadi, shuning uchun
     * qator balandligi 30px — qizil chiziq esa vertikal boʻlgani uchun
     * takrorlanishi koʻrinmaydi.
     */
    id: "notebook",
    label: "Daftar varagʻi",
    tone: "light",
    style: {
      backgroundColor: "oklch(0.958 0 0)",
      backgroundImage: [
        "linear-gradient(90deg, transparent 50px, oklch(0.842 0.088 15.6) 50px, oklch(0.842 0.088 15.6) 52px, transparent 52px)",
        "linear-gradient(oklch(0.91 0 0) 0.1em, transparent 0.1em)",
      ].join(", "),
      backgroundSize: "100% 30px",
    },
  },
  {
    /**
     * Husnixat mashqi — «qiya chizgʻich» (rus/oʻzbek maktab tizimida
     * *косая линейка*). Manba: M. Gʻulomov, «Yozuv daftari», 1-sinf,
     * «Maʼnaviyat» 2018 — Xalq taʼlimi vazirligi tasdiqlagan daftar.
     *
     * ── STANDART: ГОСТ 12063-89 «Тетради школьные» ────────────────
     * Oʻlchamlar rasmdan chamalanmaydi — standartda MATN bilan
     * yozilgan:
     *
     *   • qiyalik burchagi                65,0°
     *   • qiya chiziqlar oraligʻi         27,0 mm (QATOR boʻyicha)
     *   • ishchi qator (рабочая строка)    4 mm
     *   → nisbat 27 / 4 = 6,75
     *
     * ⚠️ Baʼzi manbalar «2,7 mm» deb yozadi — bu oʻnlik xatosi.
     * Tekshiruv: A4 ning 170 mm yozuv kengligida 2,7 mm oraliq 63 ta
     * qiya chiziq beradi (shtrixovka), 27 mm esa 6 ta — barcha referens
     * rasmlarda aynan 6–7 ta koʻrinadi.
     *
     * Bizda band = 24px → 1 mm = 6px → qiya gorizontal 162px,
     * perpendikulyar P = 162 × sin(65°) = 147px.
     *
     * ── QOLGAN OʻLCHAMLAR CHAMALANMAYDI, HISOBLANADI ──────────────
     * Bu naqsh ikki marta koʻz bilan chamalab qilindi va ikkalasida
     * ham xato chiqdi: 34px juda siyrak, 20px esa matoga oʻxshab
     * ketdi. Toʻgʻri yoʻl — asl daftardagi NISBATni olish:
     *
     *   • qiyalik burchagi        65° (standart yozuv qiyaligi)
     *   • yozuv bandi             1x — IKKI kuchli chiziq orasi
     *   • oraliq                  2x — oʻrtasida BITTA kuchsiz chiziq
     *   • takrorlanish davri      3x
     *   • qiya chiziqlar oraligʻi ≈ 1.6 × davr (gorizontal boʻyicha)
     *   • chiziq qalinligi        2px (doska uchun; qogʻozda 1px)
     *
     * `repeating-linear-gradient` da oraliq chiziqqa PERPENDIKULYAR
     * oʻlchanadi, gorizontal boʻyicha emas. Shuning uchun:
     *
     *   gorizontal oraliq = P / sin(65°) = P / 0.906
     *   kerakli 77px      → P = 70px
     *
     * Burchak: CSS burchagi gradient YOʻNALISHI, chiziqlar esa unga
     * perpendikulyar. 65° li «/» chiziq uchun 65 + 50 emas, balki
     * 115deg kerak (65° + 90° − 40°… tekshirilgan qiymat: 115deg).
     * `45deg` mumtoz «barber pole» aynan «\» beradi — shuni esda tuting.
     *
     * ⚠️ Gorizontal chiziqlar TENG ORALIQDA emas. Ikki marta shunday
     * qilindi (avval bir xil, keyin ingichka+toʻq juftlik) — ikkalasi
     * ham «hujjat blankasi» taassurotini berdi. Daftarni daftar
     * qiladigan narsa — RITM: toʻldiriladigan band va undan kengroq
     * boʻsh oraliq. Shuning uchun butun davr bitta
     * `repeating-linear-gradient` da yoziladi, `background-size` bilan
     * emas: bir davr ichida uch xil chiziq bor.
     *
     * ⚠️ HOSHIYA (chekka chizigʻi) ATAYLAB YOʻQ. Qogʻoz daftarda u
     * oʻqituvchi izohi uchun joy qoldiradi — doskada esa hech kim
     * chetga yozmaydi, u faqat ekranni boʻlib turadi. Haqiqiy
     * foydalanuvchi soʻrasa qaytariladi.
     *
     * ⚠️ Chiziqlar 2px — qogʻozdagidan qalinroq. Bu DOSKA: proyektorga
     * chiqadi va sinfning orqasidan koʻriladi. 1px «hairline» qogʻozda
     * nafis, ekranda esa yoʻqoladi.
     *
     * ── Qatlamlar (birinchisi eng ustda) ──────────────────────────
     *   1. qiya chizgʻich 65°
     *   2. gorizontal ritm: band (2 kuchli) + oraliq (1 kuchsiz)
     */
    id: "husnixat",
    label: "Husnixat mashqi",
    tone: "light",
    style: {
      backgroundColor: "oklch(1 0 0)",
      backgroundImage: [
        "repeating-linear-gradient(115deg, oklch(0.7 0.14 232) 0 2px, transparent 2px 147px)",
        [
          "repeating-linear-gradient(to bottom",
          "oklch(0.7 0.14 232) 0 2px",
          "transparent 2px 24px",
          "oklch(0.7 0.14 232) 24px 26px",
          "transparent 26px 60px)",
        ].join(", "),
      ].join(", "),
      /* Qiya chiziq chetgacha boradi, gorizontal qator esa YOʻQ —
         tepada va pastda bittadan davr boʻsh qoladi. Daftarda ham
         shunday: chiziq sahifa qirrasiga tegib turmaydi. */
      backgroundRepeat: "repeat, no-repeat",
      backgroundPosition: "0 0, 0 60px",
      backgroundSize: "100% 100%, 100% calc(100% - 120px)",
    },
  },
  {
    id: "dusk",
    label: "Kechki tus",
    tone: "dark",
    style: { background: "linear-gradient(160deg, oklch(0.36 0.07 265), oklch(0.34 0.09 300))" },
  },
  {
    /**
     * Rangli shakllar — bolalarcha, oʻyinqaroq fon: sof qora zamin
     * ustida sochilgan kichik rangli kontur shakllar.
     *
     * ⚠️ Bu blok QOʻLDA yozilmaydi. U
     * `scripts/doska-shakllar.mjs` bilan generatsiya qilinadi va
     * natijasi shu yerga koʻchiriladi. Oʻzgartirish kerak boʻlsa —
     * skriptni tahrirlab, qayta ishga tushiring.
     *
     * ── JOYLASHUV: POISSON-DISK (BLUE NOISE) ──────────────────────
     * Naqsh uch marta panjara asosida qilindi (kataklarga boʻlib,
     * ±30px «tasodifiy» siljitib) va uchalasida ham bir xil natija:
     * panjara koʻrinib turdi. Sabab oddiy — siljish katak oʻlchamiga
     * nisbatan kichik boʻlsa, koʻz baribir qatorlarni yigʻib oladi.
     *
     * Sof `Math.random()` esa teskari xato: nuqtalar goh uyum boʻlib
     * qoladi, goh katta boʻshliq qoldiradi («oq shovqin»).
     *
     * Sanoat yechimi — Bridson'ning Poisson-disk sampling'i, yaʼni
     * «blue noise»: nuqtalar tasodifiy, lekin ular orasidagi MINIMAL
     * masofa kafolatlanadi. Aynan shu usul o't-oʻlan/daraxt
     * tarqatishda, stipple chizmalarda va dithering maskalarida
     * ishlatiladi. Natija: uyum ham, boʻshliq ham, panjara ham yoʻq.
     *
     * Sampling TORDA (torus) bajariladi — tile chetlari bir-biriga
     * ulangan deb hisoblanadi, shuning uchun masofa kafolati chok
     * ustida ham buzilmaydi.
     *
     * ── CHOK: QIRRANI KESUVCHI SHAKL IKKI MARTA CHIZILADI ─────────
     * Avval shakllar qirradan 13px naridan boshlanardi — bu tile
     * atrofida boʻsh «yoʻlak» qoldiradi va aynan oʻsha yoʻlak chokni
     * koʻrsatadi. Endi shakl qirrani bemalol kesib oʻtadi, kesuvchi
     * shakl esa qarama-qarshi tomonda ±800px siljish bilan QAYTA
     * chiziladi. Shuning uchun `<use>` soni nuqtalar sonidan koʻp.
     *
     * ── RANG: HAR SHAKLGA BITTA, FAQAT OʻZINIKI ───────────────────
     * `shakl → rang` munosabati 1:1. Shakl turi 12 ta: bu kategorik
     * palitraning idrok chegarasi — ColorBrewer/Tableau/`d3.schemeCategory10`
     * hammasi shu atrofda toʻxtaydi, chunki odam 12 tadan koʻp rangni
     * ishonchli farqlay olmaydi.
     *
     * Hue'ni matematik teng (30°) boʻlish IDROK jihatidan teng emas:
     * koʻk-zangori sohada 30° arzimas farq beradi. Shuning uchun
     * palitra koordinatali tushish bilan optimallanadi — maqsad eng
     * yaqin juftlikning OKLab masofasini maksimallashtirish.
     *
     * ⚠️ Faqat hue'ni siljitish YETARLI EMAS: doimiy L va C da hue
     * doirasining uzunligi ≈ 2π·C ≈ 0,94, uni 12 ga boʻlsak nazariy
     * maksimum ≈ 0,078. Sinov buni tasdiqladi — faqat hue boʻyicha
     * optimallash 0,065 dan 0,069 gacha koʻtardi, xolos. Shuning
     * uchun YORQINLIK ham oʻzgaruvchi qilindi (Tableau20 och/toʻq
     * juftlik ishlatishining sababi aynan shu).
     *
     * ⚠️ Hue oʻz sektoridan ±14° dan uzoqqa chiqmaydi. Erkin
     * qoldirilganda optimizator sof maximin uchun hue'larni sRGB
     * gamut kengroq boʻlgan yashil-zangori sohaga tiqdi va
     * binafsha/pushti butunlay yoʻqoldi. Sektor cheklovi kamalak
     * qamrovini saqlaydi, ajratishni esa yorqinlik zimmasiga yuklaydi.
     *
     * ── TOʻYINGANLIK: PASTEL BOʻLIB QOLMASIN ──────────────────────
     * ⚠️ Avval C qatʼiy 0,17 edi va L 0,86 gacha koʻtarildi — sRGB'da
     * baland yorqinlik chroma'ni siqadi, natijada butun palitra
     * PASTEL chiqdi va shikoyatga sabab boʻldi. Endi har (L, hue)
     * uchun gamutga sigʻadigan ENG KATTA chroma binary search bilan
     * olinadi: rang doim gamut chegarasida turadi.
     *
     * Chroma poli (0,16) — toʻyinganlik ↔ ajratish almashuvining
     * tugmasi. Oʻlchangan: pol 0,14 → dE 0,145 lekin sariq zaytun va
     * toʻq sariq jigarrang chiqadi; 0,16 → dE 0,102, sariq va qizil
     * jonli; 0,18+ → dE 0,10 chegarasidan tushadi, chroma esa
     * oʻsmaydi (gamut cheklovi). 0,16 tanlandi.
     *
     * Buni oqlaydigan narsa: bu yerda rang IKKILAMCHI belgi, asosiy
     * farqlovchi — shakl. Rangga yolgʻiz tayanilmaydi.
     *
     * ⚠️ Yorqinlik [0,62; 0,88] oraligʻida. Quyi chegara kerak (0,56
     * dagi yashil loyqa chiqdi), yuqorisini esa 0,82 da ushlab turish
     * XATO edi — sariq sRGB'da faqat baland L da jonli (sof sariq
     * L≈0,97). Shipni koʻtarish avval xavfli edi (L=0,90 da koʻk
     * chroma'si 0,049 ga tushib deyarli OQ boʻlgan), lekin chroma
     * poli aynan shuni toʻsadi. Eng toʻqi ham fondan (L=0,14) ancha
     * yorqin — proyektorda birortasi yoʻqolmaydi.
     *
     * ── SHAKL TOʻQNASHUVI: BURILISH CHEKLANADI ────────────────────
     * ⚠️ Kvadrat 45° burilsa ROMB boʻladi, X esa PLYUS boʻladi. Rang
     * shaklga bogʻlangani uchun bu tizimni buzadi: bir xil koʻrinishdagi
     * ikki shakl ikki xil rangda chiqadi. Shuning uchun `s` va `r`
     * uchun burilish ±12°, `x` uchun ±15° bilan cheklangan. Shu sababli
     * `z` (zigzag) va `n` (plyus) umuman olib tashlandi — ular `l`
     * (chaqmoq) va `x` bilan chalkashardi.
     *
     * ⚠️ Shakllar `<defs>` da BIR MARTA taʼriflanadi va `<use>`
     * bilan qoʻyiladi — aks holda data-URI bir necha KB gacha
     * shishadi. Rang `color` orqali beriladi, shakl ichida esa
     * `currentColor` — shuning uchun bitta taʼrif har rangda ishlaydi.
     *
     * ⚠️ Fon deyarli sof qora (`oklch(0.14 …)`), gradient EMAS.
     * Gradient sinab koʻrildi: proyektorda pastki burchak «kir»
     * boʻlib koʻrinadi va shakllar kontrasti joyiga qarab oʻzgaradi.
     *
     * ⚠️ `#c` — «yarim oy» EMAS, teng boʻlingan doira: aniq 270° yoy,
     * kesigi 90° va oʻngga qarab simmetrik. Avval u ikki xil radiusli
     * erkin yoy edi va «ezilgan» koʻrinardi. Uchlari r=9 doiraning
     * ±45° nuqtalarida: 9·cos45° ≈ 6,4 → (6,4; 6,4) dan (6,4; −6,4)
     * gacha, `large-arc=1 sweep=1` (270°, ekranda soat yoʻnalishi).
     * `rotate()` faqat kesik joyini burab, boʻlinish tengligini
     * buzmaydi.
     */
    id: "shakllar",
    label: "Rangli shakllar",
    tone: "dark",
    style: {
      backgroundColor: "oklch(0.14 0.006 300)",
      backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'>
          <defs>
            <g id='t' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linejoin='round'><polygon points='0,-11 10,7 -10,7'/></g>
            <g id='s' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linejoin='round'><rect x='-9' y='-9' width='18' height='18' rx='4'/></g>
            <g id='d' fill='currentColor'><circle cx='0' cy='-7' r='2.8'/><circle cx='6' cy='4' r='2.8'/><circle cx='-6' cy='4' r='2.8'/></g>
            <g id='x' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round'><path d='M-6,-6 6,6 M6,-6 -6,6'/></g>
            <g id='c' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round'><path d='M6.4,6.4 A9,9 0 1 1 6.4,-6.4'/></g>
            <g id='r' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linejoin='round'><polygon points='0,-11 11,0 0,11 -11,0'/></g>
            <g id='p' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linejoin='round'><polygon points='0,-11 10,-3 6,9 -6,9 -10,-3'/></g>
            <g id='w' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round'><path d='M-12,0 q4,-7 8,0 t8,0 t8,0'/></g>
            <g id='o' fill='none' stroke='currentColor' stroke-width='2.2'><circle r='8'/></g>
            <g id='h' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linejoin='round'><polygon points='10,0 5,8.7 -5,8.7 -10,0 -5,-8.7 5,-8.7'/></g>
            <g id='a' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linejoin='round'><polygon points='0,-11 2.6,-3.6 10.5,-3.4 4.3,1.4 6.5,8.9 0,4.5 -6.5,8.9 -4.3,1.4 -10.5,-3.4 -2.6,-3.6'/></g>
            <g id='l' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linejoin='round'><path d='M2,-11 -6,1 0,1 -2,11 6,-1 0,-1 Z'/></g>
          </defs>
          <use href='#w' color='#f62100' transform='translate(514,793) rotate(1)'/>
          <use href='#w' color='#f62100' transform='translate(514,-7) rotate(1)'/>
          <use href='#s' color='#00b0fe' transform='translate(597,43) rotate(8)'/>
          <use href='#d' color='#eba000' transform='translate(492,74) rotate(-12)'/>
          <use href='#c' color='#6cce00' transform='translate(592,743) rotate(250)'/>
          <use href='#t' color='#f1007d' transform='translate(520,665) rotate(21)'/>
          <use href='#r' color='#db00d1' transform='translate(431,759) rotate(-4)'/>
          <use href='#o' color='#008cdf' transform='translate(577,116)'/>
          <use href='#x' color='#6772ff' transform='translate(421,84) rotate(10)'/>
          <use href='#p' color='#00f9dd' transform='translate(711,784) rotate(-15)'/>
          <use href='#a' color='#dc89ff' transform='translate(582,241)'/>
          <use href='#h' color='#fccb00' transform='translate(695,143) rotate(9)'/>
          <use href='#l' color='#00a14d' transform='translate(481,276) rotate(10)'/>
          <use href='#l' color='#00a14d' transform='translate(717,64) rotate(-9)'/>
          <use href='#o' color='#008cdf' transform='translate(504,374)'/>
          <use href='#h' color='#fccb00' transform='translate(461,183) rotate(-10)'/>
          <use href='#p' color='#00f9dd' transform='translate(361,149) rotate(-14)'/>
          <use href='#r' color='#db00d1' transform='translate(396,298) rotate(-5)'/>
          <use href='#a' color='#dc89ff' transform='translate(304,340) rotate(7)'/>
          <use href='#t' color='#f1007d' transform='translate(341,18) rotate(-20)'/>
          <use href='#x' color='#6772ff' transform='translate(604,310) rotate(3)'/>
          <use href='#d' color='#eba000' transform='translate(638,645) rotate(9)'/>
          <use href='#w' color='#f62100' transform='translate(344,242) rotate(-8)'/>
          <use href='#c' color='#6cce00' transform='translate(237,63) rotate(65)'/>
          <use href='#s' color='#00b0fe' transform='translate(486,560) rotate(-8)'/>
          <use href='#o' color='#008cdf' transform='translate(677,711)'/>
          <use href='#p' color='#00f9dd' transform='translate(280,735) rotate(-8)'/>
          <use href='#w' color='#f62100' transform='translate(260,455) rotate(-6)'/>
          <use href='#l' color='#00a14d' transform='translate(260,164) rotate(13)'/>
          <use href='#h' color='#fccb00' transform='translate(432,670) rotate(-2)'/>
          <use href='#d' color='#eba000' transform='translate(363,696) rotate(-12)'/>
          <use href='#r' color='#db00d1' transform='translate(776,204) rotate(2)'/>
          <use href='#x' color='#6772ff' transform='translate(166,90) rotate(6)'/>
          <use href='#s' color='#00b0fe' transform='translate(184,663) rotate(11)'/>
          <use href='#t' color='#f1007d' transform='translate(186,547) rotate(-19)'/>
          <use href='#o' color='#008cdf' transform='translate(175,224)'/>
          <use href='#a' color='#dc89ff' transform='translate(554,601)'/>
          <use href='#t' color='#f1007d' transform='translate(273,245) rotate(16)'/>
          <use href='#c' color='#6cce00' transform='translate(64,700) rotate(57)'/>
          <use href='#w' color='#f62100' transform='translate(205,731) rotate(-2)'/>
          <use href='#r' color='#db00d1' transform='translate(764,694) rotate(9)'/>
          <use href='#p' color='#00f9dd' transform='translate(432,380) rotate(-11)'/>
          <use href='#d' color='#eba000' transform='translate(735,280) rotate(23)'/>
          <use href='#a' color='#dc89ff' transform='translate(282,584) rotate(-5)'/>
          <use href='#c' color='#6cce00' transform='translate(669,226) rotate(16)'/>
          <use href='#h' color='#fccb00' transform='translate(696,412) rotate(10)'/>
          <use href='#x' color='#6772ff' transform='translate(235,330) rotate(14)'/>
          <use href='#s' color='#00b0fe' transform='translate(57,203) rotate(-9)'/>
          <use href='#l' color='#00a14d' transform='translate(612,551) rotate(-3)'/>
          <use href='#t' color='#f1007d' transform='translate(90,93) rotate(3)'/>
          <use href='#r' color='#db00d1' transform='translate(571,425) rotate(10)'/>
          <use href='#c' color='#6cce00' transform='translate(170,299) rotate(264)'/>
          <use href='#l' color='#00a14d' transform='translate(372,499) rotate(15)'/>
          <use href='#d' color='#eba000' transform='translate(504,479) rotate(14)'/>
          <use href='#x' color='#6772ff' transform='translate(259,651) rotate(-11)'/>
          <use href='#w' color='#f62100' transform='translate(26,352)'/>
          <use href='#o' color='#008cdf' transform='translate(413,567)'/>
          <use href='#p' color='#00f9dd' transform='translate(168,477) rotate(-7)'/>
          <use href='#x' color='#6772ff' transform='translate(685,528) rotate(-10)'/>
          <use href='#s' color='#00b0fe' transform='translate(637,372) rotate(-1)'/>
          <use href='#h' color='#fccb00' transform='translate(108,792) rotate(14)'/>
          <use href='#h' color='#fccb00' transform='translate(108,-8) rotate(14)'/>
          <use href='#c' color='#6cce00' transform='translate(429,457) rotate(267)'/>
          <use href='#a' color='#dc89ff' transform='translate(773,426) rotate(-16)'/>
          <use href='#s' color='#00b0fe' transform='translate(702,602) rotate(9)'/>
          <use href='#a' color='#dc89ff' transform='translate(295,103) rotate(-2)'/>
          <use href='#w' color='#f62100' transform='translate(777,117) rotate(9)'/>
          <use href='#l' color='#00a14d' transform='translate(94,476) rotate(-3)'/>
          <use href='#p' color='#00f9dd' transform='translate(636,468) rotate(12)'/>
          <use href='#d' color='#eba000' transform='translate(5,19) rotate(18)'/>
          <use href='#d' color='#eba000' transform='translate(805,19) rotate(18)'/>
          <use href='#h' color='#fccb00' transform='translate(121,353) rotate(-15)'/>
          <use href='#w' color='#f62100' transform='translate(30,611) rotate(-1)'/>
          <use href='#t' color='#f1007d' transform='translate(774,567) rotate(19)'/>
          <use href='#l' color='#00a14d' transform='translate(17,281) rotate(4)'/>
          <use href='#r' color='#db00d1' transform='translate(342,621) rotate(-11)'/>
          <use href='#o' color='#008cdf' transform='translate(59,415)'/>
          <use href='#r' color='#db00d1' transform='translate(183,404) rotate(5)'/>
          <use href='#d' color='#eba000' transform='translate(105,596) rotate(19)'/>
          <use href='#o' color='#008cdf' transform='translate(179,11)'/>
          <use href='#o' color='#008cdf' transform='translate(179,811)'/>
          <use href='#h' color='#fccb00' transform='translate(36,532) rotate(7)'/>
          <use href='#t' color='#f1007d' transform='translate(744,352) rotate(-20)'/>
          <use href='#p' color='#00f9dd' transform='translate(147,158) rotate(12)'/>
          <use href='#h' color='#fccb00' transform='translate(359,421) rotate(13)'/>
          <use href='#a' color='#dc89ff' transform='translate(88,274) rotate(-18)'/>
        </svg>`,
      )}")`,
      backgroundSize: "800px 800px",
      backgroundRepeat: "repeat",
    },
  },
];

/** Standart fon — birinchi ochilganda shu koʻrinadi. */
export const DEFAULT_BACKGROUND_ID = "chalkboard-green";

export function backgroundById(id: string | null | undefined): DoskaBackground {
  return (
    DOSKA_BACKGROUNDS.find((b) => b.id === id) ??
    DOSKA_BACKGROUNDS.find((b) => b.id === DEFAULT_BACKGROUND_ID)!
  );
}
