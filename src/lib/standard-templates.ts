// Tayyor standart toʻplamlari — jahon va milliy ramkalardan (CEFR, Common Core,
// NGSS, Australian Curriculum, UK National Curriculum, OʻzDTS). Foydalanuvchi
// shulardan birini tanlab sinfiga biriktiradi (import = nusxa). Kengaytiriladigan.

import type { StandardItem } from "@/lib/standards-data";
import { STANDARDS_DATA, SUBJECTS, SUBJECT_GROUPS_BY_AREA } from "@/lib/standards-data";

export interface SetTemplate {
  id: string;
  /** Toʻplam nomi (mas. "English — Year 10") */
  name: string;
  /** Fan — SUBJECTS bilan mos */
  subject: string;
  /** Manba ramka, mas. "CEFR", "Common Core", "NGSS" */
  source: string;
  /** Ramka kod prefiksi, mas. "AC9E10" (asosiy sahifada koʻrinadi) */
  frameworkCode: string;
  /** Mamlakat */
  country: string;
  /** Hudud (ixtiyoriy — milliy/shtat) */
  region: string;
  /** Sinf/bosqich */
  grade: string;
  /** Qisqa izoh */
  blurb: string;
  /** Toʻplamdagi standartlar */
  standards: StandardItem[];
}

const s = (id: string, bloom: string, desc: string, extra: Partial<StandardItem> = {}): StandardItem => ({
  id,
  covered: false,
  bloom,
  desc,
  ...extra,
});

export const SET_TEMPLATES: SetTemplate[] = [
  // ─── Ingliz tili — CEFR (Xalqaro) ─────────────────────────────────────────
  {
    id: "cefr-a2", name: "Ingliz tili — CEFR A2", subject: "Ingliz tili",
    source: "CEFR", frameworkCode: "CEFR.A2", country: "Xalqaro", region: "Yevropa Kengashi", grade: "A2",
    blurb: "Yevropa til ramkasi A2 — kundalik vaziyatlarda asosiy muloqot.",
    standards: [
      s("A2.L1", "tushunish", "Oʻquvchi sekin va aniq aytilgan kundalik iboralar va tez-tez ishlatiladigan soʻzlarni tushuna oladi.", { foundational: true }),
      s("A2.R1", "tushunish", "Oʻquvchi qisqa, oddiy matnlardan (eʼlon, menyu, jadval) kerakli aniq maʼlumotni topa oladi."),
      s("A2.SI1", "qollash", "Oʻquvchi tanish mavzularda oddiy maʼlumot almashishni talab qiladigan suhbatda qatnasha oladi."),
      s("A2.SP1", "qollash", "Oʻquvchi oilasi, atrofi va hozirgi/oʻtgan ishlarini oddiy iboralar bilan taʼriflay oladi."),
      s("A2.W1", "yaratish", "Oʻquvchi qisqa, oddiy yozma xabar va shaxsiy xat yoza oladi.", { assessType: "subjective" }),
    ],
  },
  {
    id: "cefr-b1", name: "Ingliz tili — CEFR B1", subject: "Ingliz tili",
    source: "CEFR", frameworkCode: "CEFR.B1", country: "Xalqaro", region: "Yevropa Kengashi", grade: "B1",
    blurb: "CEFR B1 — tanish mavzularda mustaqil muloqot va matn yaratish.",
    standards: [
      s("B1.L1", "tushunish", "Oʻquvchi ish, maktab, hordiq kabi tanish mavzulardagi aniq nutqning asosiy mazmunini tushuna oladi.", { foundational: true }),
      s("B1.R1", "tahlil", "Oʻquvchi kundalik til ishlatilgan matnlarda hodisa, his va istaklar tavsifini tushuna oladi."),
      s("B1.SI1", "qollash", "Oʻquvchi sayohat paytida yuzaga keladigan koʻp vaziyatlar bilan tilda tayyorgarliksiz uddalasha oladi."),
      s("B1.W1", "yaratish", "Oʻquvchi tanish mavzularda bogʻlangan oddiy matn (insho, xat) yoza oladi.", { assessType: "subjective" }),
    ],
  },

  // ─── Matematika — Common Core (AQSH) ──────────────────────────────────────
  {
    id: "ccss-math-6", name: "Matematika — Common Core (6-sinf)", subject: "Matematika",
    source: "Common Core", frameworkCode: "CCSS.6", country: "AQSH", region: "Federal", grade: "6-sinf",
    blurb: "Common Core 6-sinf — nisbatlar, ifodalar va sonlar tizimi.",
    standards: [
      s("6.RP.1", "tushunish", "Oʻquvchi nisbat tushunchasini anglaydi va ikki miqdor orasidagi nisbatni til bilan taʼriflay oladi.", { foundational: true }),
      s("6.RP.3", "qollash", "Oʻquvchi nisbat va birlik narx masalalarini jadval va tenglama yordamida yecha oladi."),
      s("6.NS.1", "qollash", "Oʻquvchi kasrni kasrga boʻlishni tushunadi va amaliy masalalarda qoʻllay oladi."),
      s("6.EE.2", "qollash", "Oʻquvchi harfiy ifodalarni oʻqiy, yoza va hisoblay oladi (oʻzgaruvchi qatnashgan)."),
      s("6.EE.5", "tahlil", "Oʻquvchi tenglama/tengsizlik yechimini berilgan qiymatlarni qoʻyib tekshira oladi."),
    ],
  },
  {
    id: "ccss-math-7", name: "Matematika — Common Core (7-sinf)", subject: "Matematika",
    source: "Common Core", frameworkCode: "CCSS.7", country: "AQSH", region: "Federal", grade: "7-sinf",
    blurb: "Common Core 7-sinf — proporsional munosabatlar va ratsional sonlar.",
    standards: [
      s("7.RP.2", "tahlil", "Oʻquvchi miqdorlar orasidagi proporsional munosabatni aniqlay va koʻrsata oladi.", { foundational: true }),
      s("7.NS.1", "qollash", "Oʻquvchi musbat va manfiy ratsional sonlarni qoʻshish va ayirishni amalda qoʻllay oladi."),
      s("7.EE.4", "qollash", "Oʻquvchi real masalalarni chiziqli tenglama va tengsizlik tuzib yecha oladi."),
      s("7.G.4", "qollash", "Oʻquvchi aylana yuzasi va uzunligi formulalarini bilib, masalalarda qoʻllay oladi."),
    ],
  },

  // ─── Tabiiy fanlar — NGSS (AQSH) ──────────────────────────────────────────
  {
    id: "ngss-ms-ps", name: "Fizika — NGSS (Materiya)", subject: "Fizika",
    source: "NGSS", frameworkCode: "NGSS.MS-PS1", country: "AQSH", region: "Federal", grade: "Oʻrta bosqich",
    blurb: "Next Generation Science Standards — materiya va uning oʻzaro taʼsiri.",
    standards: [
      s("MS-PS1-1", "yaratish", "Oʻquvchi oddiy molekulalar atom tuzilishini koʻrsatuvchi model qura oladi.", { foundational: true }),
      s("MS-PS1-2", "tahlil", "Oʻquvchi modda xossalari maʼlumotini tahlil qilib, kimyoviy oʻzgarishni aniqlay oladi."),
      s("MS-PS1-4", "yaratish", "Oʻquvchi haroratning zarrachalar harakatiga taʼsirini tushuntiruvchi model ishlab chiqa oladi."),
      s("MS-PS2-2", "tahlil", "Oʻquvchi kuchlar obyekt harakatini qanday oʻzgartirishini dalil bilan tushuntira oladi."),
    ],
  },
  {
    id: "ngss-ms-ls", name: "Biologiya — NGSS (Tirik organizmlar)", subject: "Biologiya",
    source: "NGSS", frameworkCode: "NGSS.MS-LS1", country: "AQSH", region: "Federal", grade: "Oʻrta bosqich",
    blurb: "NGSS — hujayralar, organizmlar va ularning oʻzaro taʼsiri.",
    standards: [
      s("MS-LS1-1", "tahlil", "Oʻquvchi barcha tirik organizmlar hujayralardan tashkil topganini dalil bilan koʻrsata oladi.", { foundational: true }),
      s("MS-LS1-2", "tushunish", "Oʻquvchi hujayra qismlari (yadro, membrana) vazifasini tushuntiruvchi model qura oladi."),
      s("MS-LS2-3", "tahlil", "Oʻquvchi ekotizimda energiya va modda aylanishini diagrammada koʻrsata oladi."),
    ],
  },

  // ─── Australian Curriculum (Avstraliya) ───────────────────────────────────
  {
    id: "ac-english-10", name: "Ingliz tili — Australian Curriculum (Year 10)", subject: "Ingliz tili",
    source: "Australian Curriculum", frameworkCode: "AC9E10", country: "Avstraliya", region: "Milliy", grade: "10-sinf",
    blurb: "Avstraliya milliy oʻquv dasturi — 10-sinf ingliz tili (matn tahlili va yaratish).",
    standards: [
      s("AC9E10LA01", "tahlil", "Oʻquvchi til tanlovi matnning maqsadi va auditoriyasiga qanday taʼsir qilishini tahlil qila oladi.", { foundational: true }),
      s("AC9E10LE02", "baholash", "Oʻquvchi adabiy matnlardagi gʻoya va qadriyatlarni baholay va munozara qila oladi."),
      s("AC9E10LY06", "yaratish", "Oʻquvchi maqsadli, izchil va tahririy jihatdan toza matnlar yarata oladi.", { assessType: "subjective" }),
    ],
  },
  {
    id: "ac-math-9", name: "Matematika — Australian Curriculum (Year 9)", subject: "Matematika",
    source: "Australian Curriculum", frameworkCode: "AC9M9", country: "Avstraliya", region: "Milliy", grade: "9-sinf",
    blurb: "Avstraliya milliy oʻquv dasturi — 9-sinf matematika.",
    standards: [
      s("AC9M9N01", "qollash", "Oʻquvchi sonlarni ilmiy shaklda (standart koʻrinishda) ifodalay va hisoblay oladi.", { foundational: true }),
      s("AC9M9A02", "qollash", "Oʻquvchi chiziqli ifodalarni soddalashtirib, tenglamalarni yecha oladi."),
      s("AC9M9M03", "tahlil", "Oʻquvchi oʻxshash shakllarda yuza va hajm nisbatini hisoblay oladi."),
    ],
  },

  // ─── UK National Curriculum (Buyuk Britaniya) ─────────────────────────────
  {
    id: "uk-computing-ks3", name: "Informatika — UK National Curriculum (KS3)", subject: "Informatika va axborot texnologiyalari",
    source: "UK National Curriculum", frameworkCode: "UK.CS.KS3", country: "Buyuk Britaniya", region: "Angliya", grade: "KS3",
    blurb: "Buyuk Britaniya milliy dasturi — Key Stage 3 informatika (algoritm, dasturlash).",
    standards: [
      s("CS3.1", "qollash", "Oʻquvchi muammoni kichik qismlarga ajratib (dekompozitsiya) algoritm tuza oladi.", { foundational: true }),
      s("CS3.2", "qollash", "Oʻquvchi kamida bitta matnli dasturlash tilida (mas. Python) dastur yoza oladi."),
      s("CS3.3", "tahlil", "Oʻquvchi mantiqiy amallar (AND/OR/NOT) yordamida shartlarni qura va tekshira oladi."),
      s("CS3.4", "tushunish", "Oʻquvchi internet va onlayn xavfsizlik tamoyillarini tushuntira oladi."),
    ],
  },

  // ─── OʻzDTS (Oʻzbekiston) ──────────────────────────────────────────────────
  {
    id: "uzdts-informatika-9", name: "Informatika — DTS (9-sinf)", subject: "Informatika va axborot texnologiyalari",
    source: "OʻzDTS", frameworkCode: "DTS.INF9", country: "Oʻzbekiston", region: "Milliy", grade: "9-sinf",
    blurb: "Davlat taʼlim standarti — 9-sinf informatika (fayllar, xavfsizlik, veb).",
    standards: STANDARDS_DATA,
  },
  {
    id: "uzdts-matematika-7", name: "Matematika — DTS (7-sinf)", subject: "Matematika",
    source: "OʻzDTS", frameworkCode: "DTS.MAT7", country: "Oʻzbekiston", region: "Milliy", grade: "7-sinf",
    blurb: "Davlat taʼlim standarti — 7-sinf matematika (ratsional sonlar, ifodalar).",
    standards: [
      s("MAT7.1", "qollash", "Oʻquvchi ratsional sonlar ustida amallarni bajara oladi.", { foundational: true }),
      s("MAT7.2", "qollash", "Oʻquvchi bir nomaʼlumli chiziqli tenglamalarni yecha oladi."),
      s("MAT7.3", "tahlil", "Oʻquvchi proporsiya va foiz masalalarini yecha oladi."),
      s("MAT7.4", "tushunish", "Oʻquvchi koordinata tekisligida nuqtalarni belgilab, grafik oʻqiy oladi."),
    ],
  },
  {
    id: "uzdts-onatili-5", name: "Ona tili — DTS (5-sinf)", subject: "Ona tili",
    source: "OʻzDTS", frameworkCode: "DTS.OT5", country: "Oʻzbekiston", region: "Milliy", grade: "5-sinf",
    blurb: "Davlat taʼlim standarti — 5-sinf ona tili (fonetika, soʻz turkumlari).",
    standards: [
      s("OT5.1", "bilish", "Oʻquvchi unli va undosh tovushlarni farqlay va toʻgʻri talaffuz qila oladi.", { foundational: true }),
      s("OT5.2", "tushunish", "Oʻquvchi soʻz turkumlarini (ot, sifat, feʼl) misollar bilan ajrata oladi."),
      s("OT5.3", "yaratish", "Oʻquvchi berilgan mavzuda izchil va savodli matn (bayon) yoza oladi.", { assessType: "subjective" }),
    ],
  },
];

/* ── Filtrlash yordamchilari ──────────────────────────────────── */

/** Toʻliq mamlakatlar roʻyxati — baʼzilari hozircha boʻsh (toʻplam yoʻq). */
export const ALL_COUNTRIES = [
  "Oʻzbekiston",
  "Xalqaro",
  "AQSH",
  "Buyuk Britaniya",
  "Avstraliya",
  "Kanada",
  "Rossiya",
  "Qozogʻiston",
  "Qirgʻiziston",
  "Tojikiston",
  "Turkmaniston",
  "Turkiya",
  "Germaniya",
  "Fransiya",
  "Finlyandiya",
  "Singapur",
  "Yaponiya",
  "Janubiy Koreya",
  "Xitoy",
  "Hindiston",
];

/** Toʻliq sinf/bosqich roʻyxati — Oʻzbekiston 1–11, til darajalari (CEFR), KS. */
export const ALL_GRADES = [
  ...Array.from({ length: 11 }, (_, i) => `${i + 1}-sinf`),
  "A1", "A2", "B1", "B2", "C1", "C2",
  "KS3",
  "Oʻrta bosqich",
];

/** Fanlar — maktab fanlarining toʻliq roʻyxati (standards-data SUBJECTS). */
export const ALL_SUBJECTS = [...SUBJECTS];

/** Fanlar — yoʻnalish boʻyicha guruhlangan, nom koʻrinishida (standartlar
    kutubxonasi filtri shablonlarning `subject` nomi bilan ishlaydi).
    Katalogdan hosil qilinadi — qoʻlda takrorlanmaydi. */
export const SUBJECT_GROUPS: { label: string; items: string[] }[] =
  SUBJECT_GROUPS_BY_AREA.map((g) => ({
    label: g.label,
    items: g.items.map((s) => s.label),
  }));

/** Sinf/daraja — guruhlangan (dropdown uchun). */
export const GRADE_GROUPS: { label: string; items: string[] }[] = [
  { label: "Sinflar", items: Array.from({ length: 11 }, (_, i) => `${i + 1}-sinf`) },
  { label: "CEFR darajalari", items: ["A1", "A2", "B1", "B2", "C1", "C2"] },
  { label: "Boshqa", items: ["KS3", "Oʻrta bosqich"] },
];

/** Qaysi qiymatlarda toʻplam bor (boʻsh boʻlmaganlarini belgilash uchun). */
export const NONEMPTY_COUNTRIES = new Set(SET_TEMPLATES.map((t) => t.country));
export const NONEMPTY_SUBJECTS = new Set(SET_TEMPLATES.map((t) => t.subject));
export const NONEMPTY_GRADES = new Set(SET_TEMPLATES.map((t) => t.grade));

export interface TemplateFilters {
  query?: string;
  country?: string;
  region?: string;
  subject?: string;
  grade?: string;
}

/** Berilgan filtrlar boʻyicha tayyor toʻplamlarni qaytaradi. */
export function filterTemplates(f: TemplateFilters): SetTemplate[] {
  const q = f.query?.trim().toLowerCase() ?? "";
  return SET_TEMPLATES.filter((t) => {
    if (f.country && t.country !== f.country) return false;
    if (f.region && t.region !== f.region) return false;
    if (f.subject && t.subject !== f.subject) return false;
    if (f.grade && t.grade !== f.grade) return false;
    if (q) {
      const hay = `${t.name} ${t.subject} ${t.source} ${t.frameworkCode}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
