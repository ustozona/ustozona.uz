/* ════════════════════════════════════════════════════════════════════
   REFLEKSIV KUNDALIK — tiplar, konfiguratsiya va mock maʼlumotlar
   ════════════════════════════════════════════════════════════════════ */

// ── Samaradorlik tipi (Effectiveness) ──────────────────────────────

export type LessonEffectiveness = 1 | 2 | 3 | 4 | 5;

export type EffectivenessConfig = {
  label: string;
  color: string;
  bg: string;
};

export const EFFECTIVENESS_CONFIG: Record<LessonEffectiveness, EffectivenessConfig> = {
  5: { label: "Ajoyib",     color: "text-emerald-600", bg: "bg-emerald-500/10" },
  4: { label: "Yaxshi",     color: "text-sky-600",     bg: "bg-sky-500/10" },
  3: { label: "Oʻrtacha",   color: "text-amber-600",   bg: "bg-amber-500/10" },
  2: { label: "Qiyin",      color: "text-orange-600",  bg: "bg-orange-500/10" },
  1: { label: "Juda qiyin", color: "text-red-600",     bg: "bg-red-500/10" },
};

export const EFFECTIVENESS_ORDER: LessonEffectiveness[] = [1, 2, 3, 4, 5];

// ── Kategoriyalar ──────────────────────────────────────────────────

export const CATEGORIES = [
  "Sinf boshqaruvi",
  "Motivatsiya",
  "Texnologiya va vositalar",
  "Baholash",
  "Metodika",
  "Vaqt taqsimoti",
  "Guruhli ish",
  "Maxsus ehtiyojlar"
] as const;

export type JournalCategory = typeof CATEGORIES[number];

// ── Asosiy tip ─────────────────────────────────────────────────────

export type JournalEntry = {
  id: string;
  /** Bogʻlangan dars IDsi (lessons-data.ts dagi Lesson.id) */
  lessonId: string | null;
  /** Bogʻlangan sinf IDsi (grades-data.ts dagi ClassInfo.id) */
  classId: string | null;
  /** Refleksiya sanasi — "YYYY-MM-DD" */
  date: string;
  /** Dars samaradorligi (1 dan 5 gacha) */
  effectiveness: LessonEffectiveness;

  // ── Gibbs sikli (Yangi yondashuv - Pedagogik diagnostika) ──
  highlights?: string;
  misconceptions?: string;
  nextSteps?: string;
  freeNotes?: string;

  /** Ovozli qayd URL yoki mock holati */
  audioRecordUrl?: string | null;
  /** Biriktirilgan fayllar/rasmlar (doska rasmi, o'quvchi ishi) */
  attachments: string[];
  /** Mentor bilan ulashilganmi? */
  isShared: boolean;
  /** AI tomonidan berilgan qisqa izoh/taklif */
  aiInsights?: string | null;

  /** Predefined Kategoriyalar */
  categories: JournalCategory[];
  createdAt: string;
  updatedAt: string;
};

// ── Mock data ──────────────────────────────────────────────────────

const today = new Date();
const formatDate = (date: Date) => date.toISOString().split("T")[0];
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return formatDate(d);
};

export const JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: "j-1",
    lessonId: "l1",
    classId: "6-a",
    date: daysAgo(0),
    effectiveness: 4,
    highlights: "Oʻquvchilar salomlashish iboralarini (hello, nice to meet you) rolli oʻyin orqali juda yaxshi oʻzlashtirdi. Ayniqsa, juftlik dialoglarida faol ishtirok etishdi.",
    misconceptions: "Bir nechta oʻquvchi \"How are you?\" va \"How old are you?\" savollarini chalkashtirib yubordi. Talaffuzda urgʻu xatolari boʻldi.",
    nextSteps: "Kelgusi darsda savol-javob uchun mini-dialog kartochkalari tarqataman — oʻquvchilar oʻzaro amaliyot qilishadi. Bu ogʻzaki koʻnikma beradi.",
    attachments: [],
    isShared: true,
    aiInsights: "Rolli oʻyin (role-play) orqali oʻrgatish soʻzlashuv koʻnikmasini sezilarli oshiradi. Keyingi dars rejangizga dialog amaliyoti vaqti avtomatik qoʻshildi.",
    categories: ["Metodika", "Guruhli ish"],
    createdAt: new Date(today.getTime() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(today.getTime() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "j-2",
    lessonId: "l6",
    classId: "7-b",
    date: daysAgo(1),
    effectiveness: 5,
    highlights: "Oila aʼzolari mavzusida guruhlarga boʻlib ishladik. Har bir guruh oʻz \"family tree\"sini qogʻozda chizdi va egalik olmoshlari bilan tasvirlab berdi — natija kutilgandan ham yaxshi boʻldi!",
    misconceptions: "His va her olmoshlarini ishlatishda chalkashlik boʻldi. Oʻquvchilar jinsiga qarab tanlashni unutib qoʻyishdi.",
    nextSteps: "His/her uchun oddiy vizual jadval tayyorlayman: rasm + olmosh. Plakat ham chop qilaman.",
    freeNotes: "Guruhli ish juda samarali boʻldi. Buni boshqa sinflarda ham qoʻllayman.",
    audioRecordUrl: "mock-audio-123.mp3",
    attachments: ["/images/board-sketch.jpg"],
    isShared: false,
    categories: ["Guruhli ish", "Metodika"],
    createdAt: new Date(today.getTime() - 1000 * 60 * 60 * 26).toISOString(),
    updatedAt: new Date(today.getTime() - 1000 * 60 * 60 * 26).toISOString(),
  },
  {
    id: "j-3",
    lessonId: "l3",
    classId: "6-a",
    date: daysAgo(2),
    effectiveness: 3,
    highlights: "Present Simple zamonida kundalik ishlarni oʻrgatdik. Koʻpchilik oʻquvchilar amaliy mashqni (daily routine) mustaqil bajara oldi.",
    misconceptions: "Uchinchi shaxs birlikda feʼlga -s qoʻshishni (he goes, she works) koʻp oʻquvchi unutib qoldi. Vaqt yetishmadi.",
    nextSteps: "Keyingi darsda -s qoidasi uchun qisqa drill va oʻyin tayyorlayman. Avval misol, keyin mustaqil mashq beraman.",
    attachments: [],
    isShared: true,
    categories: ["Metodika", "Vaqt taqsimoti"],
    createdAt: new Date(today.getTime() - 1000 * 60 * 60 * 50).toISOString(),
    updatedAt: new Date(today.getTime() - 1000 * 60 * 60 * 50).toISOString(),
  },
  {
    id: "j-4",
    lessonId: null,
    classId: "8-a",
    date: daysAgo(3),
    effectiveness: 2,
    highlights: "Reading darsida yangi soʻzlarni kontekstdan topishni oʻrgatdim. Ba'zi oʻquvchilar juda tez oʻzlashtirdi va qoʻshimcha matn oldi.",
    misconceptions: "Sinf boshqaruvi qiyin boʻldi — 3-4 ta oʻquvchi doimiy ravishda chalg'idi va boshqalarni ham chalg'itdi. Dars rejasidan orqada qoldik.",
    nextSteps: "Sinf qoidalarini qaytadan eslataman. Chalg'iyotgan oʻquvchilar uchun alohida oʻrindiq tartibi qilaman. Qoʻshimcha topshiriq berib, band qilib qoʻyaman.",
    attachments: [],
    isShared: false,
    categories: ["Sinf boshqaruvi"],
    createdAt: new Date(today.getTime() - 1000 * 60 * 60 * 74).toISOString(),
    updatedAt: new Date(today.getTime() - 1000 * 60 * 60 * 74).toISOString(),
  },
  {
    id: "j-5",
    lessonId: null,
    classId: "5-a",
    date: daysAgo(4),
    effectiveness: 5,
    highlights: "Ingliz tili boshlangʻich darsida \"Alphabet va sonlar\" mavzusini oʻtdik. Oʻquvchilar interaktiv viktorina orqali juda faol ishtirok etishdi.",
    misconceptions: "Deyarli hech qanday qiyinchilik boʻlmadi.",
    nextSteps: "Harflar va sonlar koʻnikmasini mustahkamlash uchun qisqa oʻyin-mashq (spelling bee) qoʻshaman.",
    attachments: [],
    isShared: false,
    categories: ["Motivatsiya", "Metodika"],
    createdAt: new Date(today.getTime() - 1000 * 60 * 60 * 98).toISOString(),
    updatedAt: new Date(today.getTime() - 1000 * 60 * 60 * 98).toISOString(),
  },
  {
    id: "j-6",
    lessonId: null,
    classId: "9-a",
    date: daysAgo(5),
    effectiveness: 4,
    highlights: "Writing darsida norasmiy xat tuzilishini oʻrgatdik. Oʻquvchilar namuna asosida oʻz xatlarini mustaqil yozishdi.",
    misconceptions: "Ba'zi oʻquvchilar bogʻlovchilarni (and, but, because) notoʻgʻri ishlatdi. Paragraf tuzilishi koʻp vaqt oldi.",
    nextSteps: "Kelgusi darsda avval bogʻlovchilar mashqini berib, keyin xat yozishga oʻtaman. Vizual namuna (model letter) tayyorlayman.",
    attachments: ["/images/student-essay-draft.jpg"],
    isShared: true,
    aiInsights: "Yozma ishlar koʻpincha namuna (model text) yetishmasligidan zaiflashadi. Tayyor namunadan foydalanish yaxshi yechim.",
    categories: ["Metodika", "Baholash"],
    createdAt: new Date(today.getTime() - 1000 * 60 * 60 * 122).toISOString(),
    updatedAt: new Date(today.getTime() - 1000 * 60 * 60 * 122).toISOString(),
  },
  {
    id: "j-7",
    lessonId: null,
    classId: "7-b",
    date: daysAgo(6),
    effectiveness: 3,
    highlights: "Grammatika darsida Present Simple inkor va savol shakllarini oʻrgatdim.",
    misconceptions: "Don't va doesn't ni toʻgʻri tanlashda oʻquvchilar adashdi (he don't). Yordamchi feʼl mantiqida chalkashlik boʻldi.",
    nextSteps: "Jadval (do/does) orqali vizuallashtiraman. Avval qoidani koʻrsatib, keyin mustaqil mashqqa oʻtamiz.",
    attachments: [],
    isShared: false,
    categories: ["Metodika"],
    createdAt: new Date(today.getTime() - 1000 * 60 * 60 * 146).toISOString(),
    updatedAt: new Date(today.getTime() - 1000 * 60 * 60 * 146).toISOString(),
  },
  {
    id: "j-8",
    lessonId: null,
    classId: "5-b",
    date: daysAgo(7),
    effectiveness: 1,
    misconceptions: "Sinf juda shovqinli edi. Bir nechta oʻquvchi oʻrtasida janjal chiqdi va darsning yarmi sinf boshqaruviga ketdi. Dars rejasini bajarib boʻlmadim.",
    nextSteps: "Sinf rahbari bilan gaplashaman. Kelgusi darsda oʻyin elementlarini qoʻshib, diqqatni jalb qilaman. Qoidalar plakatini devorga ilib qoʻyaman.",
    freeNotes: "Bugungi dars eng qiyin darslarimdan biri boʻldi. Lekin har qanday kun oʻrganish imkoniyati.",
    attachments: [],
    isShared: true,
    categories: ["Sinf boshqaruvi", "Motivatsiya"],
    createdAt: new Date(today.getTime() - 1000 * 60 * 60 * 170).toISOString(),
    updatedAt: new Date(today.getTime() - 1000 * 60 * 60 * 170).toISOString(),
  },
];

