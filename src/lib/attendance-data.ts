import { CLASSES, type ClassInfo, type Student } from "@/lib/grades-data";

export type AttendanceStatus = "present" | "absent" | "late" | "excused" | "unmarked";

export type AttendanceRecord = {
  studentId: string;
  date: string; // "YYYY-MM-DD"
  status: AttendanceStatus;
  note?: string;
};

export type LessonDay = {
  date: string; // "YYYY-MM-DD"
  dayOfWeek: number; // 0=Sun..6=Sat
};

export type AttendanceClassData = {
  info: ClassInfo;
  students: Student[];
  lessonDays: LessonDay[];
  records: AttendanceRecord[];
};

// O'quvchilar — har sinf uchun
const STUDENTS_BY_CLASS: Record<string, Student[]> = {
  "9-a": [
    { id: "ap", name: "Asadbek Panjiyev",     initials: "AP" },
    { id: "de", name: "Davron Eshbo'riyev",    initials: "DE" },
    { id: "da", name: "Dilafruz Abdumurodova", initials: "DA" },
    { id: "dk", name: "Dilora Karimova",       initials: "DK" },
    { id: "dj", name: "Dilshodbek Jovliyev",   initials: "DJ" },
    { id: "ea", name: "Elnur Avduvaitov",      initials: "EA" },
    { id: "ja", name: "Javohir Abduzairov",    initials: "JA" },
    { id: "kf", name: "Kibora Farhodova",      initials: "KF" },
    { id: "nj", name: "Nafisa Jo'rayeva",      initials: "NJ" },
    { id: "ok", name: "O'rol Karimov",         initials: "OK" },
    { id: "pm", name: "Parviz Mirzayev",       initials: "PM" },
    { id: "sa", name: "Sarvinoz Alimova",      initials: "SA" },
    { id: "sh", name: "Sherzod Holiqov",       initials: "SH" },
    { id: "un", name: "Umida Nazarova",        initials: "UN" },
    { id: "zt", name: "Zulfiya Tursunova",     initials: "ZT" },
    { id: "ab", name: "Abdulloh Botirov",      initials: "AB" },
  ],
};

// Dars kunlarini generatsiya qilish (har chorshanba va juma)
function generateLessonDays(year: number, month: number, weekdays: number[]): LessonDay[] {
  const days: LessonDay[] = [];
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    if (weekdays.includes(date.getDay())) {
      days.push({
        date: date.toISOString().slice(0, 10),
        dayOfWeek: date.getDay(),
      });
    }
    date.setDate(date.getDate() + 1);
  }
  return days;
}

const APRIL_LESSONS = generateLessonDays(2026, 4, [3, 5]); // chorshanba=3, juma=5
const MAY_LESSONS   = generateLessonDays(2026, 5, [3, 5, 6]); // +shanba

function makeRecords(students: Student[], days: LessonDay[]): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const statuses: AttendanceStatus[] = ["present", "present", "present", "absent", "late", "present", "present", "excused"];
  let i = 0;
  for (const s of students) {
    for (const d of days) {
      const status = statuses[i % statuses.length];
      i++;
      if (status === "unmarked") continue;
      records.push({ studentId: s.id, date: d.date, status });
    }
  }
  return records;
}

const students9a = STUDENTS_BY_CLASS["9-a"];

export const ATTENDANCE_DATA: Record<string, AttendanceClassData> = {
  "9-a": {
    info: CLASSES.find((c) => c.id === "9-a")!,
    students: students9a,
    lessonDays: [...APRIL_LESSONS, ...MAY_LESSONS],
    records: makeRecords(students9a, [...APRIL_LESSONS, ...MAY_LESSONS]),
  },
};

export function getOrCreateClassData(classId: string): AttendanceClassData {
  if (ATTENDANCE_DATA[classId]) return ATTENDANCE_DATA[classId];
  const info = CLASSES.find((c) => c.id === classId) ?? { id: classId, name: classId };
  const students: Student[] = [
    { id: "s1", name: "O'quvchi 1", initials: "O1" },
    { id: "s2", name: "O'quvchi 2", initials: "O2" },
    { id: "s3", name: "O'quvchi 3", initials: "O3" },
  ];
  const days = generateLessonDays(2026, 4, [3, 5]);
  return { info, students, lessonDays: days, records: makeRecords(students, days) };
}

export function getStatus(
  records: AttendanceRecord[],
  studentId: string,
  date: string
): AttendanceStatus {
  return records.find((r) => r.studentId === studentId && r.date === date)?.status ?? "unmarked";
}

export function getNote(records: AttendanceRecord[], studentId: string, date: string): string {
  return records.find((r) => r.studentId === studentId && r.date === date)?.note ?? "";
}

export function studentStats(records: AttendanceRecord[], studentId: string) {
  const mine = records.filter((r) => r.studentId === studentId);
  return {
    present: mine.filter((r) => r.status === "present").length,
    absent:  mine.filter((r) => r.status === "absent").length,
    late:    mine.filter((r) => r.status === "late").length,
    excused: mine.filter((r) => r.status === "excused").length,
  };
}

export const DAY_NAMES_SHORT = ["Yak", "Du", "Se", "Cho", "Pay", "Ju", "Sha"];
export const MONTH_NAMES = [
  "Yanvar","Fevral","Mart","Aprel","May","Iyun",
  "Iyul","Avgust","Sentabr","Oktabr","Noyabr","Dekabr",
];
