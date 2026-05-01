export type { ClassColor } from "@/lib/class-colors";
import { type ClassColor, autoClassColor } from "@/lib/class-colors";

export type ClassInfo = {
  id: string;
  name: string;
  color?: ClassColor;
  time?: string;
};

export type Student = {
  id: string;
  name: string;
  initials: string;
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

export type Topic = {
  id: string;
  name: string;
  color: TopicColor;
  weightPercent: number; // hammasi qo'shilib 100 bo'lishi kerak
  inputMode: InputMode;
  passLabel: string; // faqat select mode'da: "Bajardi"
  failLabel: string; // faqat select mode'da: "Bajarmadi"
};

export type AssignmentWeight = "light" | "normal" | "heavy" | "exam";

export const WEIGHT_LABELS: Record<AssignmentWeight, string> = {
  light: "Light",
  normal: "Normal",
  heavy: "Heavy",
  exam: "Exam",
};

export const WEIGHT_COLORS: Record<
  AssignmentWeight,
  { bg: string; text: string; ring: string }
> = {
  light: {
    bg: "bg-sky-100 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-300",
    ring: "ring-sky-300 dark:ring-sky-800",
  },
  normal: {
    bg: "bg-green-100 dark:bg-green-950/40",
    text: "text-green-700 dark:text-green-300",
    ring: "ring-green-300 dark:ring-green-800",
  },
  heavy: {
    bg: "bg-amber-100 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    ring: "ring-amber-300 dark:ring-amber-800",
  },
  exam: {
    bg: "bg-red-100 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-300",
    ring: "ring-red-300 dark:ring-red-800",
  },
};

export type Assignment = {
  id: string;
  title: string;
  maxScore: number;
  topicId: string;
  weight: AssignmentWeight;
};

export type Grade = {
  studentId: string;
  assignmentId: string;
  score: number | null;
  // select mode'da score = 100 (pass) yoki 0 (fail). null = bo'sh.
  isDraft?: boolean;
  isMissing?: boolean;
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
  { id: "club-1", name: "To'garak (1-guruh)" },
  { id: "club-2", name: "To'garak (2-guruh)" },
  { id: "no-class", name: "Sinf tanlanmagan", color: "gray" },
];

export function classColor(cls: ClassInfo): ClassColor {
  if (cls.color) return cls.color;
  const idx = CLASSES.findIndex((c) => c.id === cls.id);
  return autoClassColor(idx === -1 ? cls.id : idx);
}

// Topic ranglari uchun palitra
export const TOPIC_COLORS: Record<
  TopicColor,
  { bg: string; cellBg: string; text: string; ring: string; dot: string; bar: string }
> = {
  blue: {
    bg: "bg-sky-100 dark:bg-sky-950/40",
    cellBg: "bg-sky-50 dark:bg-sky-950/20",
    text: "text-sky-700 dark:text-sky-300",
    ring: "ring-sky-300 dark:ring-sky-800",
    dot: "bg-sky-500",
    bar: "rgb(14 165 233)",
  },
  violet: {
    bg: "bg-violet-100 dark:bg-violet-950/40",
    cellBg: "bg-violet-50 dark:bg-violet-950/20",
    text: "text-violet-700 dark:text-violet-300",
    ring: "ring-violet-300 dark:ring-violet-800",
    dot: "bg-violet-500",
    bar: "rgb(139 92 246)",
  },
  orange: {
    bg: "bg-orange-100 dark:bg-orange-950/40",
    cellBg: "bg-orange-50 dark:bg-orange-950/20",
    text: "text-orange-700 dark:text-orange-300",
    ring: "ring-orange-300 dark:ring-orange-800",
    dot: "bg-orange-500",
    bar: "rgb(249 115 22)",
  },
  red: {
    bg: "bg-red-100 dark:bg-red-950/40",
    cellBg: "bg-red-50 dark:bg-red-950/20",
    text: "text-red-700 dark:text-red-300",
    ring: "ring-red-300 dark:ring-red-800",
    dot: "bg-red-500",
    bar: "rgb(239 68 68)",
  },
  green: {
    bg: "bg-green-100 dark:bg-green-950/40",
    cellBg: "bg-green-50 dark:bg-green-950/20",
    text: "text-green-700 dark:text-green-300",
    ring: "ring-green-300 dark:ring-green-800",
    dot: "bg-green-500",
    bar: "rgb(34 197 94)",
  },
  teal: {
    bg: "bg-teal-100 dark:bg-teal-950/40",
    cellBg: "bg-teal-50 dark:bg-teal-950/20",
    text: "text-teal-700 dark:text-teal-300",
    ring: "ring-teal-300 dark:ring-teal-800",
    dot: "bg-teal-500",
    bar: "rgb(20 184 166)",
  },
  pink: {
    bg: "bg-pink-100 dark:bg-pink-950/40",
    cellBg: "bg-pink-50 dark:bg-pink-950/20",
    text: "text-pink-700 dark:text-pink-300",
    ring: "ring-pink-300 dark:ring-pink-800",
    dot: "bg-pink-500",
    bar: "rgb(236 72 153)",
  },
  amber: {
    bg: "bg-amber-100 dark:bg-amber-950/40",
    cellBg: "bg-amber-50 dark:bg-amber-950/20",
    text: "text-amber-700 dark:text-amber-300",
    ring: "ring-amber-300 dark:ring-amber-800",
    dot: "bg-amber-500",
    bar: "rgb(245 158 11)",
  },
};

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

// Avto rang tanlash (mavjud topic'lardagi ranglar bo'lmagan birinchi rang)
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

function makeStudents(names: string[]): Student[] {
  return names.map((name, i) => ({
    id: `s-${i}-${name.replace(/\s+/g, "-").toLowerCase()}`,
    name,
    initials: makeInitials(name),
  }));
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
      grades.push({
        studentId: s.id,
        assignmentId: a.id,
        score,
        isDraft: score !== null && (si + ai) % 4 === 0,
        isMissing: score === null && (si + ai) % 5 === 0,
      });
    });
  });
  return grades;
}

// ─── Topic shablonlari ────────────────────────────────────────────────────────

function makeTopics(prefix: string, weights: [number, number, number, number]): Topic[] {
  return [
    { id: `t-${prefix}-hw`,   name: "Uy vazifasi", color: "blue",   weightPercent: weights[0], inputMode: "select", passLabel: "Bajardi", failLabel: "Bajarmadi" },
    { id: `t-${prefix}-quiz`, name: "Quiz",        color: "violet", weightPercent: weights[1], inputMode: "score",  passLabel: "Bajardi", failLabel: "Bajarmadi" },
    { id: `t-${prefix}-test`, name: "Test",        color: "orange", weightPercent: weights[2], inputMode: "score",  passLabel: "Bajardi", failLabel: "Bajarmadi" },
    { id: `t-${prefix}-exam`, name: "Imtihon",     color: "red",    weightPercent: weights[3], inputMode: "score",  passLabel: "Bajardi", failLabel: "Bajarmadi" },
  ];
}

// ─── O'quvchi ismlari (o'zbekcha) ─────────────────────────────────────────────

const NAMES_5A = [
  "Abdulloh Xasanov", "Barnogul Qodirov", "Diyorbek Karimov", "Feruza Yusupova",
  "G'ayrat Normatov", "Hulkar Mirzayeva", "Ibrohim Tursunov", "Jasur Abdullayev",
  "Kamola Ergasheva", "Lochinbek Holmatov", "Malika Raximova", "Nargiza Sultonova",
  "Otabek Xoliqov", "Parizod Fattoyeva", "Ravshan Ismoilov",
];
const NAMES_5B = [
  "Sarvinoz Qosimova", "Toxir Nazarov", "Umida Tillayeva", "Vohid Boymurodov",
  "Xilola Yo'ldosheva", "Yorqin Baxtiyorov", "Zulfiya Eshniyozova", "Alisher Yunusov",
  "Barno Hasanova", "Davron Mirzayev", "Ezgulik Norqo'ziyeva", "Farruх Toshmatov",
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
  "Barcha Mirzayeva", "Doniyor Xasanov", "Ezgulik Norqo'ziyeva",
];
const NAMES_6D = [
  "Farzona Karimova", "G'ulom Toshmatov", "Hamida Xoliqova", "Ilhom Ismoilov",
  "Jumagul Raximova", "Komiljon Abdullayev", "Latofat Sultonova", "Mansur Mirzayev",
  "Nilufar Ergasheva", "Ortiq Nazarov", "Parvin Hasanova", "Qodir Boymurodov",
  "Ra'no Yusupova", "Sarvarbek Tursunov", "Tursunoy Xolmatova",
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
  "Ra'no Karimova", "Sardor Mirzayev", "Tabassum Yusupova", "Ulmas Abdullayev",
  "Vasila Normatova", "Xurshid Sultonov", "Yoqimli Raximova", "Zafar Ergashev",
  "Aziz Nazarov", "Barnogul Xasanova", "Doniyor Boymurodov", "Ezgulik Tursunova",
  "Farruх Ismoilov", "Gavhar Mirzayeva", "Hamza Karimov",
];
const NAMES_8B = [
  "Shahrizoda Jovliyeva", "Sohibjon O'roqov", "Suhrob Allanazarov", "Suhrob Jabborov",
  "Xudoyberdi Eshpo'latov", "Zebo Bahodirova", "Aliyor Karimov", "Bahrom Yusupov",
  "Dilshoda Rasulova", "Eldorbek Salimov", "Farangiz Tursunova", "Gulnoza Hakimova",
  "Hilola Kamolova", "Iskandar Nazirov", "Jahongir O'rinov", "Kamola Rashidova",
  "Lola Saidova",
];
const NAMES_9A = [
  "Mansur Xoliqov", "Nilufar Raximova", "Ortiq Ismoilov", "Parvin Mirzayeva",
  "Qodir Yusupov", "Ra'no Abdullayeva", "Sarvar Tursunov", "Tabassum Ergasheva",
  "Ulugbek Nazarov", "Venera Sultonova", "Xamza Boymurodov", "Yulduz Karimova",
  "Ziyod Toshmatov", "Adolat Raximova", "Bahodir Mirzayev",
];
const NAMES_9B = [
  "Adhamjon Eshmirzayev", "Aslbek Ahmadqulov", "Aziza Mahmanazarova", "Hasan Normurodov",
  "Komila Mustafoqulova", "Madina Eshqurbonova", "Marjona Boypo'latova", "Namoz Abdumo'minov",
  "O'g'iloy Abdumurotova", "Otabek Mahmudov", "Rayhona Abdusalomova", "Rayxona Eshmirzayeva",
  "Sabrina Abrayeva", "Shahnoza Anorboyeva",
];
const NAMES_CLUB1 = [
  "Abdulloh Xasanov", "Aziza Tojiboyeva", "Bahodir Raximov", "Charos Mirzayeva",
  "Dilnoza Ergasheva", "Eldor Yusupov", "Feruza Sultonova", "G'ayrat Nazarov",
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

function mkA(prefix: string, list: [string, AssignmentWeight][]): Assignment[] {
  return list.map(([title, w], i) => {
    const tId = w === "light" ? "hw" : w === "normal" ? "quiz" : w === "heavy" ? "test" : "exam";
    return { id: `${prefix}-a${i + 1}`, title, maxScore: 100, topicId: `t-${prefix}-${tId}`, weight: w };
  });
}

const ASSIGNMENTS_5A = mkA("5a", [
  ["Bo'sh vaqt: matn", "light"], ["So'z boyligi", "normal"], ["Uy vazifasi #1", "light"],
  ["Grammatika testi", "normal"], ["O'qish testi", "heavy"], ["Yarim yillik", "exam"],
]);
const ASSIGNMENTS_5B = mkA("5b", [
  ["Salomlashish: matn", "light"], ["So'z boyligi #1", "normal"], ["Uy vazifasi #1", "light"],
  ["Grammatika testi", "normal"], ["Yozma ish", "heavy"], ["Yarim yillik", "exam"],
]);
const ASSIGNMENTS_5D = mkA("5d", [
  ["Alifbo tekshiruvi", "light"], ["Lug'at quiz", "normal"], ["Uy vazifasi #1", "light"],
  ["O'qish testi", "heavy"], ["Yil yakuniy imtihon", "exam"],
]);
const ASSIGNMENTS_6A = mkA("6a", [
  ["Matn tahlili", "light"], ["So'z boyligi", "normal"], ["Uy vazifasi #1", "light"],
  ["Grammatika quiz", "normal"], ["O'rtacha test", "heavy"], ["Yil imtihoni", "exam"],
]);
const ASSIGNMENTS_6B = mkA("6b", [
  ["Hikoya yozish", "light"], ["Lug'at quiz", "normal"], ["Uy vazifasi", "light"],
  ["Tahlil testi", "heavy"], ["Yarim yillik", "exam"],
]);
const ASSIGNMENTS_6D = mkA("6d", [
  ["Matn o'qish", "light"], ["So'z boyligi", "normal"], ["Uy vazifasi", "light"],
  ["Grammatika testi", "heavy"], ["Yil imtihoni", "exam"],
]);
const ASSIGNMENTS_7A = mkA("7a", [
  ["Esse yozish", "light"], ["Quiz #1", "normal"], ["Uy vazifasi", "light"],
  ["Quiz #2", "normal"], ["O'rtacha test", "heavy"], ["Og'zaki test", "heavy"], ["Yil imtihoni", "exam"],
]);
const ASSIGNMENTS_7B = mkA("7b", [
  ["Matn tahlili", "light"], ["Quiz #1", "normal"], ["Uy vazifasi", "light"],
  ["Quiz #2", "normal"], ["Test #1", "heavy"], ["Test #2", "heavy"], ["Yil imtihoni", "exam"],
]);
const ASSIGNMENTS_7D = mkA("7d", [
  ["Insho", "light"], ["Quiz", "normal"], ["Uy vazifasi", "light"],
  ["Test", "heavy"], ["Og'zaki javob", "heavy"], ["Yil imtihoni", "exam"],
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
  ["Quiz #2", "normal"], ["Test #1", "heavy"], ["Test #2", "heavy"], ["Og'zaki", "heavy"], ["Yil imtihoni", "exam"],
]);
const ASSIGNMENTS_9B = mkA("9b", [
  ["Unit 1: Salomlashish", "light"], ["Unit 1: So'z boyligi", "normal"], ["Unit 2: O'qish", "light"],
  ["Unit 2: Yozish", "normal"], ["Unit 3: Grammatika", "normal"], ["Unit 3: Tinglash", "light"],
  ["Unit 4: Og'zaki nutq", "heavy"], ["O'rtacha test", "heavy"], ["Yakuniy loyiha", "exam"],
]);
const ASSIGNMENTS_C1 = mkA("club1", [
  ["Loyiha #1", "light"], ["Amaliy mashq", "normal"], ["Taqdimot", "heavy"],
]);
const ASSIGNMENTS_C2 = mkA("club2", [
  ["Loyiha #1", "light"], ["Amaliy mashq", "normal"], ["Taqdimot", "heavy"],
]);

// ─── CLASS_DATA ───────────────────────────────────────────────────────────────

function buildClass(id: string, names: string[], topics: Topic[], assignments: Assignment[]): ClassData {
  const students = makeStudents(names);
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

