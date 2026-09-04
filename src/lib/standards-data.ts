export const BLOOM_LEVELS = [
  { id: 'bilish', label: 'Bilish', color: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  { id: 'tushunish', label: 'Tushunish', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  { id: 'qollash', label: 'Qoʻllash', color: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' },
  { id: 'tahlil', label: 'Tahlil qilish', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  { id: 'baholash', label: 'Baholash', color: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
  { id: 'yaratish', label: 'Yaratish', color: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' }
];

/* ── Maktab fanlari ─────────────────────────────────────────────────────
   Oʻzbekiston umumtaʼlim + xalqaro fanlar.

   MAʼLUMOTGA `id` YOZILADI, `label` EMAS. Sabab: ilova 6 tilda ishlaydi —
   ruscha interfeysda saqlangan "Математика" va oʻzbekchada saqlangan
   "Matematika" bir xil fan ekanini tizim hech qachon bila olmasdi
   (qidiruv, filtr, oʻqituvchilar aro ulashish — hammasi buzilardi).
   `id` esa tilga bogʻliq emas va oʻzgarmaydi.

   ⚠️ `id` — DOIMIY kalit. Yozib boʻlingach hech qachon oʻzgartirilmaydi
   (maʼlumot unga bogʻlanadi); faqat `label` tahrirlanadi yoki tarjima
   qatlami qoʻshiladi.
   ────────────────────────────────────────────────────────────────────── */

export type SubjectId = (typeof SUBJECT_CATALOG)[number]["id"];

/** Fan yoʻnalishlari — tayanch oʻquv rejadagi boʻlimlar tartibida. */
export const SUBJECT_AREAS = [
  { id: "philology", label: "Filologiya fanlari" },
  { id: "social", label: "Ijtimoiy fanlar" },
  { id: "exact", label: "Aniq fanlar" },
  { id: "natural", label: "Tabiiy va iqtisodiy fanlar" },
  { id: "applied", label: "Amaliy fanlar" },
] as const;

export type SubjectAreaId = (typeof SUBJECT_AREAS)[number]["id"];

/**
 * Rasmiy fanlar — MMTV 2026-yil 10-apreldagi 133-son buyrugʻi bilan
 * tasdiqlangan 2026–2027-oʻquv yili tayanch oʻquv rejasi (1-ilova).
 *
 * `deprecated: true` — rejadan chiqqan yoki nomi oʻzgargan fan. Katalogdan
 * OʻCHIRILMAYDI: mavjud sinflar unga bogʻlangan boʻlishi mumkin, va nomi
 * baribir toʻgʻri koʻrsatilishi kerak. Yangi sinf yaratganda roʻyxatda
 * koʻrinmaydi.
 */
export const SUBJECT_CATALOG = [
  // I. Filologiya
  { id: "native_language", label: "Ona tili", area: "philology" },
  { id: "reading_literacy", label: "Oʻqish savodxonligi", area: "philology" },
  { id: "literature", label: "Adabiyot", area: "philology" },
  { id: "russian", label: "Rus tili", area: "philology" },
  { id: "foreign_language", label: "Chet tili", area: "philology" },
  { id: "english", label: "Ingliz tili", area: "philology" },
  // II. Ijtimoiy
  { id: "history_stories", label: "Tarixdan hikoyalar", area: "social" },
  { id: "history_ancient", label: "Qadimgi dunyo tarixi", area: "social" },
  { id: "history_uz", label: "Oʻzbekiston tarixi", area: "social" },
  { id: "history_world", label: "Jahon tarixi", area: "social" },
  { id: "law_basics", label: "Davlat va huquq asoslari", area: "social" },
  { id: "upbringing", label: "Tarbiya", area: "social" },
  { id: "history", label: "Tarix", area: "social", deprecated: true },
  { id: "ethics", label: "Odobnoma", area: "social", deprecated: true },
  // III. Aniq fanlar
  { id: "math", label: "Matematika", area: "exact" },
  { id: "algebra", label: "Algebra", area: "exact" },
  { id: "geometry", label: "Geometriya", area: "exact" },
  { id: "informatics", label: "Informatika va axborot texnologiyalari", area: "exact" },
  // IV. Tabiiy va iqtisodiy
  { id: "physics", label: "Fizika", area: "natural" },
  { id: "astronomy", label: "Astronomiya", area: "natural" },
  { id: "chemistry", label: "Kimyo", area: "natural" },
  { id: "biology", label: "Biologiya", area: "natural" },
  { id: "geography", label: "Geografiya", area: "natural" },
  { id: "natural_science", label: "Tabiiy fan (Science)", area: "natural" },
  { id: "economics", label: "Iqtisodiy bilim asoslari", area: "natural" },
  { id: "entrepreneurship", label: "Tadbirkorlik asoslari", area: "natural" },
  // Eslatma: 2026-08 da qayta koʻrib chiqilgan DTS eʼlon qilingan (yuqoridagi
  // ikki fan «Iqtisodiyot va biznes»ga birlashadi, astronomiya fizikaga
  // qoʻshiladi) — lekin JORIY ETILMAGAN. Kuchga kirganda qoʻshiladi.
  { id: "ecology", label: "Ekologiya", area: "natural", deprecated: true },
  // V. Amaliy fanlar
  { id: "music", label: "Musiqa madaniyati", area: "applied" },
  { id: "fine_arts", label: "Tasviriy sanʼat", area: "applied" },
  { id: "technical_drawing", label: "Chizmachilik", area: "applied" },
  { id: "technology", label: "Texnologiya", area: "applied" },
  { id: "physical_education", label: "Jismoniy tarbiya", area: "applied" },
  {
    id: "pre_conscription",
    label: "Chaqiruvga qadar boshlangʻich tayyorgarlik",
    area: "applied",
  },
  { id: "labour", label: "Mehnat taʼlimi", area: "applied", deprecated: true },
] as const;

/**
 * Eskirgan yoki qisqartirilgan nomlar → `id`. Faqat OʻQISHDA ishlatiladi:
 * bazada nom boʻlib saqlangan qiymatni kodga oʻgirish uchun. Bu yerdan
 * yozuv OLINMAYDI — koʻrsatiladigan nom doim `SUBJECT_CATALOG` dan.
 */
const SUBJECT_LABEL_ALIASES: Record<string, SubjectId> = {
  "ona tili va adabiyot": "native_language",
  "xorijiy til": "foreign_language",
  informatika: "informatics",
  musiqa: "music",
  tabiatshunoslik: "natural_science",
  "boshlangich harbiy tayyorgarlik": "pre_conscription",
};

/**
 * Qidiruv kaliti. Apostrof shakllari birxillashtiriladi (ʻ ʼ ' ` ’ ‘ → yoʻq)
 * — oʻqituvchi «Tasviriy san'at» deb yozgan boʻlsa ham katalogdagi
 * «Tasviriy sanʼat» bilan topishishi kerak.
 */
export function subjectKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[ʻʼ‘’'`´]/g, "")
    .replace(/\s+/g, " ");
}

/** Fan nomlari roʻyxati — standart shablonlari va eski filtrlar shu shaklda
    ishlaydi (ular hali `label` boʻyicha moslashtiradi). Yangi kod
    `SUBJECT_CATALOG` va `SubjectId` dan foydalanishi kerak. */
export const SUBJECTS = SUBJECT_CATALOG.map((s) => s.label);

const SUBJECT_BY_ID = new Map(SUBJECT_CATALOG.map((s) => [s.id as string, s]));
const SUBJECT_BY_LABEL = new Map<string, string>([
  ...SUBJECT_CATALOG.map((s) => [subjectKey(s.label), s.id as string] as const),
  ...Object.entries(SUBJECT_LABEL_ALIASES).map(
    ([label, id]) => [subjectKey(label), id as string] as const
  ),
]);

/**
 * Oʻqituvchi qoʻshgan fan shu prefiks bilan saqlanadi: `custom:Robototexnika`.
 * Alohida jadval kerak emas — maktabning «oʻz fanlari» roʻyxati mavjud
 * sinflardan hosil qilinadi, va ishlatilmay qolgani oʻz-oʻzidan yoʻqoladi.
 * Nom prefiksdan keyin turadi, shuning uchun tarjima qatlami yoʻq — bu
 * ataylab: rasmiy boʻlmagan fanning rasmiy tarjimasi ham yoʻq.
 */
export const CUSTOM_SUBJECT_PREFIX = "custom:";

/** Roʻyxatda koʻrsatiladigan fanlar — eskirganlari chiqarib tashlanadi. */
export const ACTIVE_SUBJECTS = SUBJECT_CATALOG.filter((s) => !("deprecated" in s));

/** Yoʻnalish boʻyicha guruhlangan faol fanlar — tanlagich roʻyxati uchun. */
export const SUBJECT_GROUPS_BY_AREA = SUBJECT_AREAS.map((area) => ({
  id: area.id,
  label: area.label,
  items: ACTIVE_SUBJECTS.filter((s) => s.area === area.id).map((s) => ({
    id: s.id as string,
    label: s.label,
  })),
})).filter((g) => g.items.length > 0);

/** `id` → koʻrsatiladigan nom. Notanish id boʻlsa oʻzini qaytaradi (maʼlumot
    yoʻqolmasin — oʻqituvchi kiritgan erkin fan nomi ham boʻlishi mumkin). */
export function subjectLabel(id: string | null | undefined): string {
  if (!id) return "";
  if (id.startsWith(CUSTOM_SUBJECT_PREFIX)) {
    return id.slice(CUSTOM_SUBJECT_PREFIX.length);
  }
  return SUBJECT_BY_ID.get(id)?.label ?? id;
}

/** Oʻqituvchi qoʻshgan fanmi? */
export function isCustomSubject(id: string | null | undefined): boolean {
  return !!id && id.startsWith(CUSTOM_SUBJECT_PREFIX);
}

/** Erkin nomdan maxsus fan kaliti yasaydi. */
export function customSubjectId(label: string): string {
  return CUSTOM_SUBJECT_PREFIX + label.trim();
}

/**
 * Nom → `id`. ESKI maʼlumotni oʻqish uchun: `classes.subject` va
 * `teachers.subject` da hozir oʻzbekcha nom saqlangan. Mos kelmasa `null` —
 * chaqiruvchi xom qiymatni saqlab qolishi mumkin.
 */
export function subjectIdFromLabel(label: string | null | undefined): SubjectId | null {
  if (!label) return null;
  return (SUBJECT_BY_LABEL.get(subjectKey(label)) as SubjectId) ?? null;
}

/** Xom qiymatni (id yoki eski nom) normallashtiradi — oʻqishda ishlatiladi. */
export function normalizeSubject(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (SUBJECT_BY_ID.has(trimmed)) return trimmed;
  return subjectIdFromLabel(trimmed) ?? trimmed;
}

/** Bitta standart yozuvi — kutubxonada ham, sinfga biriktirilganda ham shu shakl. */
/**
 * Mazmun sohasi (domen) — standartning USTIDAGI qavat.
 *
 * OʻzDTS atamasi «fanning mazmun sohasi»; xalqaro ramkalarda strand/domain.
 * Kodning ichida yashaydi: `IAT5.AD.01` → `AD`, `CCSS…RL.9-10.1` → `RL`.
 *
 * ⚠️ Bu ENUM EMAS va boʻlmasligi kerak — har toʻplam oʻz roʻyxatini
 * olib yuradi. Sabab: informatika sohalari (AD/MB/TX/KT/KY/SI) hech bir
 * jahon ramkasiga oʻxshamaydi, CEFR-2018 esa anʼanaviy 4 koʻnikmadan
 * voz kechgan. Qatʼiy tip tizimni bitta ramkaga qulflab qoʻyardi.
 *
 * Batafsil: docs/standards-page-spec.md §14.
 */
export interface StandardDomain {
  /** Kod prefiksi bilan bir xil boʻlgani maʼqul, mas. "AD", "R". */
  id: string;
  /** Koʻrsatiladigan nom — radar oʻqi va bar guruhi sarlavhasi. */
  name: string;
  /**
   * Radar oʻqlari tartibi. ⚠️ MUALLIF bergan tartib, alfavit EMAS —
   * radar shakli oʻqlar tartibiga bogʻliq, shuning uchun u maʼlumotning
   * bir qismi (spec §11.4).
   */
  order: number;
}

/** Profil radari shu oraliqda maʼnoli: kamida 3, koʻpi 8 oʻq (spec §14.4). */
export const RADAR_MIN_DOMAINS = 3;
export const RADAR_MAX_DOMAINS = 8;

export interface StandardItem {
  /** Kod, mas. "DT.01" */
  id: string;
  /** Oʻtilgan/oʻtilmagan holati */
  covered: boolean;
  /** BLOOM_LEVELS id'laridan biri */
  bloom: string;
  /** Taʼrif — "Oʻquvchi … qila oladi" */
  desc: string;
  /** Bogʻlangan dars nomi (ixtiyoriy) */
  file?: string;
  /** Bazaviy/poydevor standartmi? Ogʻirlikli qamrov uchun (v3 §9 Q1). */
  foundational?: boolean;
  /** Baholash usuli: obyektiv (quiz) yoki subʼektiv (CJ/rubrika). Default: objective. */
  assessType?: "objective" | "subjective";
  /**
   * Mazmun sohasi — `StandardSet.domains[].id` ga havola. IXTIYORIY:
   * boʻsh boʻlsa standart «Boʻlimsiz» guruhiga tushadi va hamma narsa
   * (qamrov, oʻzlashtirish, bar roʻyxati) ishlayveradi; faqat profil
   * radari chizilmaydi.
   *
   * Bir dona — koʻplik emas. Standart ikki sohaga tegishli boʻlsa, u
   * juda keng yozilgan degani va ikkiga boʻlinishi kerak (spec §14.4).
   */
  domainId?: string;
}

/** Tayyor kutubxona — ingliz tili koʻnikma standartlari (Reading, Writing, Listening,
 *  Speaking, Grammar, Vocabulary). Har sinfga shulardan tanlab qoʻshish mumkin. */
export const STANDARDS_DATA: StandardItem[] = [
  // ── Vocabulary (V) ──
  { id: "V.01", covered: true, bloom: "bilish", desc: "Oʻquvchi salomlashish, tanishuv va xushmuomalalik iboralarini (hello, nice to meet you, thank you) tanib oladi va toʻgʻri talaffuz qila oladi.", file: "Salomlashish iboralari va tanishuv", foundational: true },
  { id: "V.02", covered: true, bloom: "tushunish", desc: "Oʻquvchi oila aʼzolari va kundalik buyumlarga oid soʻz boyligini kontekstda toʻgʻri ishlatib bera oladi.", file: "Oila aʼzolari va egalik olmoshlari", foundational: true },
  { id: "V.03", covered: false, bloom: "qollash", desc: "Oʻquvchi notanish soʻz maʼnosini matn konteksti orqali taxmin qila oladi va lugʻatdan mustaqil foydalanadi." },
  // ── Grammar (G) ──
  { id: "G.01", covered: true, bloom: "tushunish", desc: "Oʻquvchi egalik olmoshlari (my, your, his, her) va to be feʼlining hozirgi shaklini toʻgʻri qoʻllay oladi.", file: "Oila aʼzolari va egalik olmoshlari", foundational: true },
  { id: "G.02", covered: true, bloom: "qollash", desc: "Oʻquvchi Present Simple zamonida kundalik ish-harakatlarni tasdiq, inkor va savol shaklida toʻgʻri ifodalay oladi.", file: "Present Simple: kundalik ishlar", foundational: true },
  { id: "G.03", covered: false, bloom: "tahlil", desc: "Oʻquvchi like / donʼt like + -ing konstruksiyasi yordamida qiziqishlari haqida toʻgʻri gap tuza oladi.", file: "Hobbilar haqida suhbat" },
  // ── Speaking (S) ──
  { id: "S.01", covered: true, bloom: "qollash", desc: "Oʻquvchi oʻzini tanishtirib, oddiy savol-javob orqali qisqa dialog yurita oladi.", file: "Salomlashish iboralari va tanishuv" },
  { id: "S.02", covered: false, bloom: "yaratish", desc: "Oʻquvchi sevimli mashgʻuloti haqida 1–2 daqiqalik ogʻzaki taqdimot tayyorlab, ravon gapira oladi.", assessType: "subjective" },
  // ── Listening (L) ──
  { id: "L.01", covered: false, bloom: "tushunish", desc: "Oʻquvchi sekin va aniq aytilgan kundalik mavzudagi matndan asosiy maʼlumotni (ism, raqam, vaqt) ajratib ola oladi." },
  // ── Reading (R) ──
  { id: "R.01", covered: true, bloom: "tushunish", desc: "Oʻquvchi tanish mavzudagi qisqa matnni oʻqib, uning asosiy gʻoyasini (main idea) aniqlay oladi.", file: "Matnni oʻqib tushunish: asosiy gʻoya", foundational: true },
  { id: "R.02", covered: true, bloom: "tahlil", desc: "Oʻquvchi matndan aniq detallarni (scanning) topa oladi va savollarga matnga asoslanib javob bera oladi.", file: "Matnni oʻqib tushunish: asosiy gʻoya" },
  // ── Writing (W) ──
  { id: "W.01", covered: true, bloom: "yaratish", desc: "Oʻquvchi paragraf tuzilishi va bogʻlovchilardan foydalanib qisqa norasmiy xat yoza oladi.", file: "Norasmiy xat yozish", assessType: "subjective" },
  { id: "W.02", covered: false, bloom: "yaratish", desc: "Oʻquvchi berilgan mavzuda 80–100 soʻzlik izchil va xatosi kam insho yoza oladi.", assessType: "subjective" },
];
