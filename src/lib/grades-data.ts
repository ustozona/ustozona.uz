export type { ClassColor } from "@/lib/class-colors";
import { type ClassColor, autoClassColor, makeColorTints, oklchToHex } from "@/lib/class-colors";

export type ClassInfo = {
  id: string;
  name: string;
  color?: ClassColor;
  time?: string;
  /** Sinf raqami (1–11); yoʻq boʻlsa — toʻgarak kabi darajasiz guruh. */
  grade?: number;
  subject?: string;
  /** Avatar ikonkasi kaliti (class-icons.ts ClassIconKey). */
  icon?: string;
  description?: string;
};

export type Student = {
  id: string;
  name: string;
  initials: string;
  status?: "active" | "away" | "archived";
  // Profil maʼlumotlari (oʻquvchi yaratish formasidagi maydonlar bilan mos)
  gender?: "male" | "female";
  birthDate?: string;     // yyyy-mm-dd
  parentName?: string;    // ota yoki onasining ismi sharifi
  parentPhone?: string;
  studentPhone?: string;
};

// Topic = baholash turi (Tests, Homework, Projects ...)
export type TopicColor =
  | "blue"
  | "violet"
  | "orange"
  | "red"
  | "green"
  | "teal"
  | "pink"
  | "amber";

export type InputMode = "score" | "select";

export type GradingScale =
  // 🇺🇿 Oʻzbekiston / umumiy maktab
  | "five"        // 5-ballik (5=aʼlo) — default
  | "ten"         // 10-ballik (10=aʼlo)
  | "percent"     // 100-ballik / foiz
  | "pass_fail"   // Bajardi / Bajarmadi (yorliq tahrirlanadi)
  | "qualitative" // eski (migratsiya uchun) — endi "five" + labelStyle:"word" bilan almashtirilgan, UI'da koʻrsatilmaydi
  // 🌍 Xalqaro maktab dasturlari
  | "letter_plus" // US letter A+…F
  | "letter_basic"// US letter A…F
  | "ib7"         // IB 1–7 (7=aʼlo)
  | "gcse"        // Britaniya 9–1 (9=aʼlo)
  | "german6"     // Germaniya 1–6 (1=aʼlo, teskari)
  | "french20"    // Fransiya 0–20 (20=aʼlo)
  // eski (migratsiya uchun; UI'da koʻrsatilmaydi)
  | "scale_6"
  | "scale_10"
  | "custom";

/** Roʻyxat badge'i uchun qisqa yorliq (masalan "A+…F"). */
export const SCALE_SHORT_LABELS: Record<GradingScale, string> = {
  five: "5-ballik",
  ten: "10-ballik",
  percent: "Foiz",
  pass_fail: "Bajardi/Bajarmadi",
  qualitative: "Sifat",
  letter_plus: "A+…F",
  letter_basic: "A…F",
  ib7: "IB 1–7",
  gcse: "9–1",
  german6: "1–6 (DE)",
  french20: "0–20",
  scale_6: "1–6",
  scale_10: "1–10",
  custom: "Maxsus",
};

/** Toifa modali shkala dropdown'i uchun toʻliq nom + guruh. */
export const GRADING_SCALE_PRESETS: {
  kind: GradingScale;
  label: string;
  group: "uz" | "intl";
}[] = [
  { kind: "five",        label: "5-ballik (5/4/3/2)",            group: "uz" },
  { kind: "ten",         label: "10-ballik (1–10)",              group: "uz" },
  { kind: "percent",     label: "100-ballik / Foiz",             group: "uz" },
  { kind: "pass_fail",   label: "Bajardi / Bajarmadi",           group: "uz" },
  { kind: "letter_plus", label: "Harf bahosi (A+ dan F gacha)",  group: "intl" },
  { kind: "letter_basic",label: "Harf bahosi (A dan F gacha)",   group: "intl" },
  { kind: "ib7",         label: "IB (1–7)",                      group: "intl" },
  { kind: "gcse",        label: "Britaniya GCSE (9–1)",          group: "intl" },
  { kind: "german6",     label: "Germaniya (1–6)",               group: "intl" },
  { kind: "french20",    label: "Fransiya (0–20)",               group: "intl" },
];

// Baholash turi: summativ "Jami"ga kiradi (vaznli), formativ faqat signal (vaznsiz).
// TOIFA darajasida belgilanadi (topshiriqda emas). undefined = "summative".
export type TopicPurpose = "formative" | "summative";
/** @deprecated `TopicPurpose` ishlating — endi toifa darajasida. */
export type AssignmentPurpose = TopicPurpose;

export type Topic = {
  id: string;
  /**
   * Sinflar aro guruhlash kaliti. Bir xil toifa ("Test") bir nechta sinfda
   * alohida nusxa boʻladi, lekin bitta `groupId`ni baham koʻradi — shu sabab
   * roʻyxatda bir marta koʻrinadi va tahrir hamma biriktirilgan sinfga tegadi.
   */
  groupId?: string;
  name: string;
  color: TopicColor;
  /** Baholash turi. Summativ → vaznli, yakuniyga kiradi. Formativ → signal. */
  purpose: TopicPurpose;
  weightPercent: number; // faqat summativ toifada; yigʻindi avto-100% normallashadi
  inputMode: InputMode;
  scaleKind?: GradingScale; // toifa darajasidagi baholash shkalasi (preset)
  passLabel: string; // faqat select modeʼda: "Bajardi"
  failLabel: string; // faqat select modeʼda: "Bajarmadi"
};

// Baho yo‘qligi turi: Q (Qatnashmadi/absent), T (Topshirmadi/unsubmitted).
// Ikkalasi ham o‘rtachadan chiqariladi (dalil yo‘qligi ≠ bilim yo‘qligi).
export type GradeMissing = "absent" | "unsubmitted";

export type Assignment = {
  id: string;
  title: string;
  maxScore: number;
  topicId: string;             // Baholash turi va shkala shu toifadan meros olinadi
  date?: string;               // yyyy-mm-dd (real sana; keyin to‘ldiriladi)
};

export type Grade = {
  studentId: string;
  assignmentId: string;
  score: number | null;
  // select modeʼda score = 100 (pass) yoki 0 (fail). null = boʻsh.
  isDraft?: boolean;
  /** @deprecated `missing` ishlating; Q/T farqlanmagan eski belgi. */
  isMissing?: boolean;
  missing?: GradeMissing; // Q (absent) / T (unsubmitted) — o‘rtachadan chiqariladi
};

export type ClassData = {
  info: ClassInfo;
  students: Student[];
  topics: Topic[];
  assignments: Assignment[];
  grades: Grade[];
};

export const CLASSES: ClassInfo[] = [
  { id: "5-a",    name: "5-A" },
  { id: "5-b",    name: "5-B" },
  { id: "5-d",    name: "5-D" },
  { id: "6-a",    name: "6-A" },
  { id: "6-b",    name: "6-B" },
  { id: "6-d",    name: "6-D" },
  { id: "7-a",    name: "7-A" },
  { id: "7-b",    name: "7-B" },
  { id: "7-d",    name: "7-D" },
  { id: "8-a",    name: "8-A" },
  { id: "8-b",    name: "8-B", time: "17:10 — 17:55" },
  { id: "9-a",    name: "9-A" },
  { id: "9-b",    name: "9-B", time: "11:25 — 12:10" },
  { id: "club-1", name: "Toʻgarak (1-guruh)" },
  { id: "club-2", name: "Toʻgarak (2-guruh)" },
  { id: "no-class", name: "Sinf tanlanmagan", color: "gray" },
];

export function classColor(cls: ClassInfo): ClassColor {
  if (cls.color) return cls.color;
  const idx = CLASSES.findIndex((c) => c.id === cls.id);
  return autoClassColor(idx === -1 ? cls.id : idx);
}

/* ════════════════════════════════════════════════════════════════════
   TOIFA RANGLARI — sinf ranglari bilan BITTA engine (class-colors).

   Har rang bitta OKLCH qiymat (`-400` daraja, v3.shadcn.com/colors).
   Hex va barcha ottenkalar (`topicTints`) shu bazadan `color-mix` orqali
   HOSIL qilinadi — qotirilgan Tailwind klasslar yoʻq, dark mode avtomatik.
   ════════════════════════════════════════════════════════════════════ */
export const TOPIC_COLOR_BASE: Record<TopicColor, string> = {
  blue:   "oklch(0.746 0.16 232.661)",  // sky-400
  violet: "oklch(0.702 0.183 293.541)", // violet-400
  orange: "oklch(0.75 0.183 55.934)",   // orange-400
  red:    "oklch(0.704 0.191 22.216)",  // red-400
  green:  "oklch(0.792 0.209 151.711)", // green-400
  teal:   "oklch(0.777 0.152 181.912)", // teal-400
  pink:   "oklch(0.718 0.202 349.761)", // pink-400
  amber:  "oklch(0.828 0.189 84.429)",  // amber-400
};

/** Topic solid rangi (hex) — TOPIC_COLOR_BASE dan HOSIL qilingan (qoʻlda emas). */
export const TOPIC_COLOR_HEX: Record<TopicColor, string> = Object.fromEntries(
  (Object.keys(TOPIC_COLOR_BASE) as TopicColor[]).map((k) => [k, oklchToHex(TOPIC_COLOR_BASE[k])])
) as Record<TopicColor, string>;

/** Toifa rangidan HOSIL qilingan ottenkalar — sinf `classTints` bilan bir shakl. */
export function topicTints(color: TopicColor) {
  return makeColorTints(TOPIC_COLOR_BASE[color]);
}

export const TOPIC_COLOR_ORDER: TopicColor[] = [
  "blue",
  "violet",
  "orange",
  "green",
  "pink",
  "teal",
  "amber",
  "red",
];

// Avto rang tanlash (mavjud topicʼlardagi ranglar boʻlmagan birinchi rang)
export function pickNextTopicColor(usedColors: TopicColor[]): TopicColor {
  for (const c of TOPIC_COLOR_ORDER) {
    if (!usedColors.includes(c)) return c;
  }
  return TOPIC_COLOR_ORDER[usedColors.length % TOPIC_COLOR_ORDER.length];
}

// Default Pass/Fail labels
export const DEFAULT_PASS_LABEL = "Bajardi";
export const DEFAULT_FAIL_LABEL = "Bajarmadi";

// ─── Yordamchi funksiyalar ────────────────────────────────────────────────────

function makeInitials(name: string): string {
  const parts = name.split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// Deterministik seed (id boʻyicha) — demo profil maʼlumotlari barqaror boʻlsin
function seedFrom(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const PARENT_FIRST_F = ["Dilnoza", "Nodira", "Gulnora", "Shahnoza", "Zulfiya", "Malika", "Saodat", "Feruza"];
const PARENT_FIRST_M = ["Akmal", "Rustam", "Sherzod", "Bahodir", "Ulugʻbek", "Jahongir", "Sardor", "Olim"];

function makePhone(seed: number): string {
  const ops = ["90", "91", "93", "94", "97", "99"];
  const op = ops[seed % ops.length];
  const a = String(((seed >>> 3) % 900) + 100);
  const b = String(((seed >>> 7) % 90) + 10);
  const c = String(((seed >>> 11) % 90) + 10);
  return `+998 ${op} ${a}-${b}-${c}`;
}

// Jinsni aniqlash (demo uchun). Familiya qoʻshimchasi (-ova/-ov) eng ishonchli
// signal — avval shuni tekshiramiz; aks holda ism koʻrsatkichlariga qaytamiz.
function femaleByName(first: string): boolean {
  return /(a|o)$|gul|noz|oy$|bibi|xon$/i.test(first);
}
function isFemale(first: string, last: string): boolean {
  if (/(ova|yeva|eva)$/i.test(last)) return true;
  if (/(ov|yev|ev)$/i.test(last)) return false;
  return femaleByName(first);
}

function makeStudents(names: string[], classId: string): Student[] {
  const grade = parseInt(classId, 10); // "5-a" → 5; "club-1" → NaN
  const baseAge = Number.isFinite(grade) ? grade + 6 : 13; // 5-sinf ≈ 11 yosh
  return names.map((name, i) => {
    // classId id tarkibida — aks holda turli sinflarda bir xil indeks+ism
    // toʻqnashadi (mas. 5-a va club-1 dagi "s-0-abdulloh-xasanov"), bu esa
    // global-unikal PK talab qiladigan bazaga zid.
    const id = `s-${classId}-${i}-${name.replace(/\s+/g, "-").toLowerCase()}`;
    const [first = "", last = ""] = name.split(" ");
    const seed = seedFrom(id);

    const female = isFemale(first, last);
    const age = baseAge + ((seed % 3) - 1); // ±1 yil
    const year = new Date().getFullYear() - age;
    const month = (seed % 12) + 1;
    const day = ((seed >>> 4) % 28) + 1;
    const birthDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // Aloqa: koʻpincha onasi; ota-ona ismi bola familiyasi bilan
    const motherContact = seed % 10 < 7;
    const pFirst = (motherContact ? PARENT_FIRST_F : PARENT_FIRST_M)[seed % 8];
    const parentName = last ? `${pFirst} ${last} (${motherContact ? "onasi" : "otasi"})` : `${pFirst} (${motherContact ? "onasi" : "otasi"})`;

    return {
      id,
      name,
      initials: makeInitials(name),
      status: "active" as const,
      gender: female ? ("female" as const) : ("male" as const),
      birthDate,
      parentName,
      parentPhone: makePhone(seed),
      // oʻquvchi telefoni — faqat katta sinflar (7+) va ~60% holatda
      studentPhone: (Number.isFinite(grade) ? grade : 7) >= 7 && seed % 5 < 3 ? makePhone(seed ^ 0x9e3779b9) : undefined,
    };
  });
}

function seedScore(seed: number): number | null {
  const r = ((seed * 9301 + 49297) % 233280) / 233280;
  if (r < 0.08) return null;
  return Math.floor(50 + r * 50);
}

function makeGrades(
  students: Student[],
  assignments: Assignment[],
  topics: Topic[]
): Grade[] {
  const topicMap = new Map(topics.map((t) => [t.id, t]));
  const grades: Grade[] = [];
  students.forEach((s, si) => {
    assignments.forEach((a, ai) => {
      const t = topicMap.get(a.topicId);
      let score = seedScore(si * 31 + ai * 17 + 5);
      if (t?.inputMode === "select" && score !== null) {
        score = score >= 70 ? 100 : 0;
      }
      const isMissing = score === null && (si + ai) % 5 === 0;
      // Q (absent) / T (unsubmitted) ni almashtirib seed qilamiz.
      const missing: GradeMissing | undefined = isMissing
        ? (si + ai) % 2 === 0
          ? "absent"
          : "unsubmitted"
        : undefined;
      grades.push({
        studentId: s.id,
        assignmentId: a.id,
        score,
        isDraft: score !== null && (si + ai) % 4 === 0,
        isMissing,
        missing,
      });
    });
  });
  return grades;
}

// ─── Topic shablonlari ────────────────────────────────────────────────────────

function makeTopics(prefix: string, weights: [number, number, number, number]): Topic[] {
  // groupId — shablon turi (sinflar aro umumiy): "Test" hamma sinfda bitta guruh.
  // Quiz = formativ (signal), qolgani = summativ (yakuniyga kiradi).
  return [
    { id: `t-${prefix}-hw`,   groupId: "hw",   name: "Uy vazifasi", color: "blue",   purpose: "summative", weightPercent: weights[0], inputMode: "select", scaleKind: "pass_fail",   passLabel: "Bajardi", failLabel: "Bajarmadi" },
    { id: `t-${prefix}-quiz`, groupId: "quiz", name: "Quiz",        color: "violet", purpose: "formative", weightPercent: weights[1], inputMode: "score",  scaleKind: "letter_plus", passLabel: "Bajardi", failLabel: "Bajarmadi" },
    { id: `t-${prefix}-test`, groupId: "test", name: "Test",        color: "orange", purpose: "summative", weightPercent: weights[2], inputMode: "score",  scaleKind: "letter_plus", passLabel: "Bajardi", failLabel: "Bajarmadi" },
    { id: `t-${prefix}-exam`, groupId: "exam", name: "Imtihon",     color: "red",    purpose: "summative", weightPercent: weights[3], inputMode: "score",  scaleKind: "letter_plus", passLabel: "Bajardi", failLabel: "Bajarmadi" },
  ];
}

// ─── Oʻquvchi ismlari (oʻzbekcha) ─────────────────────────────────────────────

const NAMES_5A = [
  "Abdulloh Xasanov", "Barnogul Qodirov", "Diyorbek Karimov", "Feruza Yusupova",
  "Gʻayrat Normatov", "Hulkar Mirzayeva", "Ibrohim Tursunov", "Jasur Abdullayev",
  "Kamola Ergasheva", "Lochinbek Holmatov", "Malika Raximova", "Nargiza Sultonova",
  "Otabek Xoliqov", "Parizod Fattoyeva", "Ravshan Ismoilov",
];
const NAMES_5B = [
  "Sarvinoz Qosimova", "Toxir Nazarov", "Umida Tillayeva", "Vohid Boymurodov",
  "Xilola Yoʻldosheva", "Yorqin Baxtiyorov", "Zulfiya Eshniyozova", "Alisher Yunusov",
  "Barno Hasanova", "Davron Mirzayev", "Ezgulik Norqoʻziyeva", "Farruх Toshmatov",
  "Gavhar Xoliqova", "Hamza Ortiqov", "Iroda Sobirov",
];
const NAMES_5D = [
  "Jamshid Rашидov", "Kamola Burxonova", "Laziz Abduraxmonov", "Munira Xolmatova",
  "Nodir Tursunov", "Oydin Karimova", "Parviz Sotvoldiyev", "Qodir Ergashev",
  "Rohila Mamatova", "Sanjar Haydarov", "Tabassum Iskandarova", "Ulugbek Nazarov",
  "Vasila Qosimova", "Xurshid Yusupov", "Yulduz Holiqova",
];
const NAMES_6A = [
  "Ziyod Raximov", "Aziza Tojiboyeva", "Bobur Xasanov", "Charos Mirzayeva",
  "Dilnoza Abdullayeva", "Eldor Nazarov", "Fotima Yusupova", "Gulbahor Ergasheva",
  "Husan Tursunov", "Iqbol Xolmatov", "Jahon Karimov", "Kamolat Sultonova",
  "Lochin Raximov", "Maftuna Normatova", "Nurillo Ismoilov",
];
const NAMES_6B = [
  "Ozoda Hasanova", "Parvina Toshmatova", "Quvondiq Mirzayev", "Ruqiya Boymurodova",
  "Sardor Xoliqov", "Tabassum Ergasheva", "Ulmas Nazarov", "Venera Karimova",
  "Xamza Abdullayev", "Yoqimli Sobirov", "Zulfizar Tursunova", "Asror Yusupov",
  "Barcha Mirzayeva", "Doniyor Xasanov", "Ezgulik Norqoʻziyeva",
];
const NAMES_6D = [
  "Farzona Karimova", "Gʻulom Toshmatov", "Hamida Xoliqova", "Ilhom Ismoilov",
  "Jumagul Raximova", "Komiljon Abdullayev", "Latofat Sultonova", "Mansur Mirzayev",
  "Nilufar Ergasheva", "Ortiq Nazarov", "Parvin Hasanova", "Qodir Boymurodov",
  "Raʼno Yusupova", "Sarvarbek Tursunov", "Tursunoy Xolmatova",
];
const NAMES_7A = [
  "Umid Karimov", "Vazira Abdullayeva", "Xasan Mirzayev", "Yoqutoy Normatova",
  "Zafar Xasanov", "Adolat Toshmatova", "Bahodir Raximov", "Chamanara Ergasheva",
  "Dilshod Yusupov", "Ezgu Sultonova", "Farhod Ismoilov", "Gavhar Abdullayeva",
  "Habib Nazarov", "Iroda Karimova", "Jasur Xoliqov",
];
const NAMES_7B = [
  "Kamola Mirzayeva", "Lazizjon Tursunov", "Mahliyo Boymurodova", "Nodir Xasanov",
  "Oysha Yusupova", "Pulat Ergashev", "Qunduz Sultonova", "Ravshan Nazarov",
  "Sarvar Karimov", "Tahminа Raximova", "Ulugbek Mirzayev", "Venera Abdullayeva",
  "Xamid Toshmatov", "Yulduz Normatova", "Ziyoda Ismoilova",
];
const NAMES_7D = [
  "Alijon Xolmatov", "Bahora Ergasheva", "Davron Yusupov", "Farangiz Karimova",
  "Gulsanam Sultonova", "Hamid Nazarov", "Iroda Mirzayeva", "Javlon Abdullayev",
  "Kamola Tursunova", "Lochinbek Raximov", "Malika Xasanova", "Nodir Boymurodov",
  "Ozod Ismoilov", "Parviz Ergashev", "Qodir Toshmatov",
];
const NAMES_8A = [
  "Raʼno Karimova", "Sardor Mirzayev", "Tabassum Yusupova", "Ulmas Abdullayev",
  "Vasila Normatova", "Xurshid Sultonov", "Yoqimli Raximova", "Zafar Ergashev",
  "Aziz Nazarov", "Barnogul Xasanova", "Doniyor Boymurodov", "Ezgulik Tursunova",
  "Farruх Ismoilov", "Gavhar Mirzayeva", "Hamza Karimov",
];
const NAMES_8B = [
  "Shahrizoda Jovliyeva", "Sohibjon Oʻroqov", "Suhrob Allanazarov", "Suhrob Jabborov",
  "Xudoyberdi Eshpoʻlatov", "Zebo Bahodirova", "Aliyor Karimov", "Bahrom Yusupov",
  "Dilshoda Rasulova", "Eldorbek Salimov", "Farangiz Tursunova", "Gulnoza Hakimova",
  "Hilola Kamolova", "Iskandar Nazirov", "Jahongir Oʻrinov", "Kamola Rashidova",
  "Lola Saidova",
];
const NAMES_9A = [
  "Mansur Xoliqov", "Nilufar Raximova", "Ortiq Ismoilov", "Parvin Mirzayeva",
  "Qodir Yusupov", "Raʼno Abdullayeva", "Sarvar Tursunov", "Tabassum Ergasheva",
  "Ulugbek Nazarov", "Venera Sultonova", "Xamza Boymurodov", "Yulduz Karimova",
  "Ziyod Toshmatov", "Adolat Raximova", "Bahodir Mirzayev",
];
const NAMES_9B = [
  "Adhamjon Eshmirzayev", "Aslbek Ahmadqulov", "Aziza Mahmanazarova", "Hasan Normurodov",
  "Komila Mustafoqulova", "Madina Eshqurbonova", "Marjona Boypoʻlatova", "Namoz Abdumoʻminov",
  "Oʻgʻiloy Abdumurotova", "Otabek Mahmudov", "Rayhona Abdusalomova", "Rayxona Eshmirzayeva",
  "Sabrina Abrayeva", "Shahnoza Anorboyeva",
];
const NAMES_CLUB1 = [
  "Abdulloh Xasanov", "Aziza Tojiboyeva", "Bahodir Raximov", "Charos Mirzayeva",
  "Dilnoza Ergasheva", "Eldor Yusupov", "Feruza Sultonova", "Gʻayrat Nazarov",
  "Hulkar Karimova", "Ibrohim Xoliqov",
];
const NAMES_CLUB2 = [
  "Jasur Tursunov", "Kamola Mirzayeva", "Laziz Abdullayev", "Malika Normatova",
  "Nodir Ismoilov", "Oydin Raximova", "Parviz Boymurodov", "Qunduz Ergasheva",
  "Ravshan Sultonov", "Sarvinoz Yusupova",
];

// ─── Topiclar ─────────────────────────────────────────────────────────────────

const TOPICS_5A  = makeTopics("5a",    [20, 25, 35, 20]);
const TOPICS_5B  = makeTopics("5b",    [20, 25, 35, 20]);
const TOPICS_5D  = makeTopics("5d",    [25, 25, 30, 20]);
const TOPICS_6A  = makeTopics("6a",    [20, 20, 40, 20]);
const TOPICS_6B  = makeTopics("6b",    [20, 25, 35, 20]);
const TOPICS_6D  = makeTopics("6d",    [25, 25, 30, 20]);
const TOPICS_7A  = makeTopics("7a",    [15, 25, 40, 20]);
const TOPICS_7B  = makeTopics("7b",    [15, 25, 40, 20]);
const TOPICS_7D  = makeTopics("7d",    [20, 20, 40, 20]);
const TOPICS_8A  = makeTopics("8a",    [15, 20, 45, 20]);
const TOPICS_8B  = makeTopics("8b",    [15, 20, 45, 20]);
const TOPICS_9A  = makeTopics("9a",    [10, 20, 45, 25]);
const TOPICS_9B  = makeTopics("9b",    [10, 20, 45, 25]);
const TOPICS_C1  = makeTopics("club1", [30, 35, 35,  0]);
const TOPICS_C2  = makeTopics("club2", [30, 35, 35,  0]);

// ─── Topshiriqlar ─────────────────────────────────────────────────────────────

// Seed sanalari: chorak boshidan (2025-09-08) har topshiriqqa ~10 kun oraliq.
function seedDate(i: number): string {
  const d = new Date(2025, 8, 8);
  d.setDate(d.getDate() + i * 10);
  return d.toISOString().slice(0, 10); // yyyy-mm-dd
}

// Seed-only: eski "vazn" yorligʻi endi faqat qaysi toifaga tushishini belgilaydi.
type SeedBucket = "light" | "normal" | "heavy" | "exam";

function mkA(prefix: string, list: [string, SeedBucket][]): Assignment[] {
  return list.map(([title, w], i) => {
    const tId = w === "light" ? "hw" : w === "normal" ? "quiz" : w === "heavy" ? "test" : "exam";
    return { id: `${prefix}-a${i + 1}`, title, maxScore: 100, topicId: `t-${prefix}-${tId}`, date: seedDate(i) };
  });
}

const ASSIGNMENTS_5A = mkA("5a", [
  ["Boʻsh vaqt: matn", "light"], ["Soʻz boyligi", "normal"], ["Uy vazifasi #1", "light"],
  ["Grammatika testi", "normal"], ["Oʻqish testi", "heavy"], ["Yarim yillik", "exam"],
]);
const ASSIGNMENTS_5B = mkA("5b", [
  ["Salomlashish: matn", "light"], ["Soʻz boyligi #1", "normal"], ["Uy vazifasi #1", "light"],
  ["Grammatika testi", "normal"], ["Yozma ish", "heavy"], ["Yarim yillik", "exam"],
]);
const ASSIGNMENTS_5D = mkA("5d", [
  ["Alifbo tekshiruvi", "light"], ["Lugʻat quiz", "normal"], ["Uy vazifasi #1", "light"],
  ["Oʻqish testi", "heavy"], ["Yil yakuniy imtihon", "exam"],
]);
const ASSIGNMENTS_6A = mkA("6a", [
  ["Matn tahlili", "light"], ["Soʻz boyligi", "normal"], ["Uy vazifasi #1", "light"],
  ["Grammatika quiz", "normal"], ["Oʻrtacha test", "heavy"], ["Yil imtihoni", "exam"],
]);
const ASSIGNMENTS_6B = mkA("6b", [
  ["Hikoya yozish", "light"], ["Lugʻat quiz", "normal"], ["Uy vazifasi", "light"],
  ["Tahlil testi", "heavy"], ["Yarim yillik", "exam"],
]);
const ASSIGNMENTS_6D = mkA("6d", [
  ["Matn oʻqish", "light"], ["Soʻz boyligi", "normal"], ["Uy vazifasi", "light"],
  ["Grammatika testi", "heavy"], ["Yil imtihoni", "exam"],
]);
const ASSIGNMENTS_7A = mkA("7a", [
  ["Esse yozish", "light"], ["Quiz #1", "normal"], ["Uy vazifasi", "light"],
  ["Quiz #2", "normal"], ["Oʻrtacha test", "heavy"], ["Ogʻzaki test", "heavy"], ["Yil imtihoni", "exam"],
]);
const ASSIGNMENTS_7B = mkA("7b", [
  ["Matn tahlili", "light"], ["Quiz #1", "normal"], ["Uy vazifasi", "light"],
  ["Quiz #2", "normal"], ["Test #1", "heavy"], ["Test #2", "heavy"], ["Yil imtihoni", "exam"],
]);
const ASSIGNMENTS_7D = mkA("7d", [
  ["Insho", "light"], ["Quiz", "normal"], ["Uy vazifasi", "light"],
  ["Test", "heavy"], ["Ogʻzaki javob", "heavy"], ["Yil imtihoni", "exam"],
]);
const ASSIGNMENTS_8A = mkA("8a", [
  ["Esse", "light"], ["Quiz #1", "normal"], ["Uy vazifasi", "light"],
  ["Quiz #2", "normal"], ["Test #1", "heavy"], ["Test #2", "heavy"], ["Yil imtihoni", "exam"],
]);
const ASSIGNMENTS_8B = mkA("8b", [
  ["Matn yozish", "light"], ["Quiz #1", "normal"], ["Uy vazifasi", "light"],
  ["Quiz #2", "normal"], ["Test #1", "heavy"], ["Test #2", "heavy"], ["Yil imtihoni", "exam"],
]);
const ASSIGNMENTS_9A = mkA("9a", [
  ["Mustaqil ish", "light"], ["Quiz #1", "normal"], ["Uy vazifasi", "light"],
  ["Quiz #2", "normal"], ["Test #1", "heavy"], ["Test #2", "heavy"], ["Ogʻzaki", "heavy"], ["Yil imtihoni", "exam"],
]);
const ASSIGNMENTS_9B = mkA("9b", [
  ["Unit 1: Salomlashish", "light"], ["Unit 1: Soʻz boyligi", "normal"], ["Unit 2: Oʻqish", "light"],
  ["Unit 2: Yozish", "normal"], ["Unit 3: Grammatika", "normal"], ["Unit 3: Tinglash", "light"],
  ["Unit 4: Ogʻzaki nutq", "heavy"], ["Oʻrtacha test", "heavy"], ["Yakuniy loyiha", "exam"],
]);
const ASSIGNMENTS_C1 = mkA("club1", [
  ["Loyiha #1", "light"], ["Amaliy mashq", "normal"], ["Taqdimot", "heavy"],
]);
const ASSIGNMENTS_C2 = mkA("club2", [
  ["Loyiha #1", "light"], ["Amaliy mashq", "normal"], ["Taqdimot", "heavy"],
]);

// ─── CLASS_DATA ───────────────────────────────────────────────────────────────

function buildClass(id: string, names: string[], topics: Topic[], assignments: Assignment[]): ClassData {
  const students = makeStudents(names, id);
  return {
    info: CLASSES.find((c) => c.id === id)!,
    students,
    topics,
    assignments,
    grades: makeGrades(students, assignments, topics),
  };
}

export const CLASS_DATA: Record<string, ClassData> = {
  "5-a":    buildClass("5-a",    NAMES_5A,    TOPICS_5A,  ASSIGNMENTS_5A),
  "5-b":    buildClass("5-b",    NAMES_5B,    TOPICS_5B,  ASSIGNMENTS_5B),
  "5-d":    buildClass("5-d",    NAMES_5D,    TOPICS_5D,  ASSIGNMENTS_5D),
  "6-a":    buildClass("6-a",    NAMES_6A,    TOPICS_6A,  ASSIGNMENTS_6A),
  "6-b":    buildClass("6-b",    NAMES_6B,    TOPICS_6B,  ASSIGNMENTS_6B),
  "6-d":    buildClass("6-d",    NAMES_6D,    TOPICS_6D,  ASSIGNMENTS_6D),
  "7-a":    buildClass("7-a",    NAMES_7A,    TOPICS_7A,  ASSIGNMENTS_7A),
  "7-b":    buildClass("7-b",    NAMES_7B,    TOPICS_7B,  ASSIGNMENTS_7B),
  "7-d":    buildClass("7-d",    NAMES_7D,    TOPICS_7D,  ASSIGNMENTS_7D),
  "8-a":    buildClass("8-a",    NAMES_8A,    TOPICS_8A,  ASSIGNMENTS_8A),
  "8-b":    buildClass("8-b",    NAMES_8B,    TOPICS_8B,  ASSIGNMENTS_8B),
  "9-a":    buildClass("9-a",    NAMES_9A,    TOPICS_9A,  ASSIGNMENTS_9A),
  "9-b":    buildClass("9-b",    NAMES_9B,    TOPICS_9B,  ASSIGNMENTS_9B),
  "club-1": buildClass("club-1", NAMES_CLUB1, TOPICS_C1,  ASSIGNMENTS_C1),
  "club-2": buildClass("club-2", NAMES_CLUB2, TOPICS_C2,  ASSIGNMENTS_C2),
};

export function getLetterGrade(percent: number): {
  letter: string;
  color: string;
} {
  if (percent >= 93) return { letter: "A", color: "text-green-600" };
  if (percent >= 90) return { letter: "A-", color: "text-green-600" };
  if (percent >= 87) return { letter: "B+", color: "text-green-600" };
  if (percent >= 83) return { letter: "B", color: "text-green-600" };
  if (percent >= 80) return { letter: "B-", color: "text-green-600" };
  if (percent >= 77) return { letter: "C+", color: "text-amber-600" };
  if (percent >= 73) return { letter: "C", color: "text-amber-600" };
  if (percent >= 70) return { letter: "C-", color: "text-amber-600" };
  if (percent >= 67) return { letter: "D+", color: "text-orange-600" };
  if (percent >= 60) return { letter: "D", color: "text-orange-600" };
  return { letter: "F", color: "text-red-600" };
}

export function getCellBgColor(percent: number): string {
  if (percent >= 90) return "bg-green-50 dark:bg-green-950/20";
  if (percent >= 80) return "bg-green-50/60 dark:bg-green-950/10";
  if (percent >= 70) return "bg-amber-50 dark:bg-amber-950/20";
  if (percent >= 60) return "bg-orange-50 dark:bg-orange-950/20";
  return "bg-red-50 dark:bg-red-950/20";
}

