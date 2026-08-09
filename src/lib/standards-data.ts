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

export const SUBJECT_CATALOG = [
  { id: "native_language", label: "Ona tili va adabiyot" },
  { id: "russian", label: "Rus tili" },
  { id: "english", label: "Ingliz tili" },
  { id: "foreign_language", label: "Xorijiy til" },
  { id: "math", label: "Matematika" },
  { id: "algebra", label: "Algebra" },
  { id: "geometry", label: "Geometriya" },
  { id: "informatics", label: "Informatika" },
  { id: "physics", label: "Fizika" },
  { id: "chemistry", label: "Kimyo" },
  { id: "biology", label: "Biologiya" },
  { id: "natural_science", label: "Tabiatshunoslik" },
  { id: "geography", label: "Geografiya" },
  { id: "astronomy", label: "Astronomiya" },
  { id: "history", label: "Tarix" },
  { id: "history_uz", label: "Oʻzbekiston tarixi" },
  { id: "history_world", label: "Jahon tarixi" },
  { id: "law_basics", label: "Davlat va huquq asoslari" },
  { id: "economics", label: "Iqtisodiy bilim asoslari" },
  { id: "upbringing", label: "Tarbiya" },
  { id: "ethics", label: "Odobnoma" },
  { id: "physical_education", label: "Jismoniy tarbiya" },
  { id: "technical_drawing", label: "Chizmachilik" },
  { id: "technology", label: "Texnologiya" },
  { id: "labour", label: "Mehnat taʼlimi" },
  { id: "music", label: "Musiqa" },
  { id: "fine_arts", label: "Tasviriy sanʼat" },
  { id: "ecology", label: "Ekologiya" },
] as const;

/** Fan nomlari roʻyxati — standart shablonlari va eski filtrlar shu shaklda
    ishlaydi (ular hali `label` boʻyicha moslashtiradi). Yangi kod
    `SUBJECT_CATALOG` va `SubjectId` dan foydalanishi kerak. */
export const SUBJECTS = SUBJECT_CATALOG.map((s) => s.label);

const SUBJECT_BY_ID = new Map(SUBJECT_CATALOG.map((s) => [s.id as string, s]));
const SUBJECT_BY_LABEL = new Map(
  SUBJECT_CATALOG.map((s) => [s.label.toLowerCase(), s])
);

/** `id` → koʻrsatiladigan nom. Notanish id boʻlsa oʻzini qaytaradi (maʼlumot
    yoʻqolmasin — oʻqituvchi kiritgan erkin fan nomi ham boʻlishi mumkin). */
export function subjectLabel(id: string | null | undefined): string {
  if (!id) return "";
  return SUBJECT_BY_ID.get(id)?.label ?? id;
}

/**
 * Nom → `id`. ESKI maʼlumotni oʻqish uchun: `classes.subject` va
 * `teachers.subject` da hozir oʻzbekcha nom saqlangan. Mos kelmasa `null` —
 * chaqiruvchi xom qiymatni saqlab qolishi mumkin.
 */
export function subjectIdFromLabel(label: string | null | undefined): SubjectId | null {
  if (!label) return null;
  const hit = SUBJECT_BY_LABEL.get(label.trim().toLowerCase());
  return (hit?.id as SubjectId) ?? null;
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
