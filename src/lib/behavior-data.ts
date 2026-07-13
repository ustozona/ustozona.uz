/* ════════════════════════════════════════════════════════════════════
   XULQ (behavior) — domen tiplari, defaultlar va pure helperlar.

   ClassDojo-uslub xulq ballari: ijobiy/salbiy koʻnikmalar, mukofot
   doʻkoni. MUHIM: xulq ballari akademik baholar tizimiga (grades)
   MUTLAQO aralashmaydi (docs/grades-v1-spec.md talabi) — bu modul
   useGradesStore'dan faqat read-only roster oladi, teskari bogʻlanish
   taqiqlangan.

   Eventlar append-only ledger: koʻnikma maʼlumotlari (name/emoji/
   description/points) event ichiga NUSXALANADI — koʻnikma keyin
   tahrirlansa/oʻchsa tarix buzilmaydi. Balans saqlanmaydi, hisoblanadi:
   Σ events.points − Σ redemptions.cost.

   React importsiz — scripts/seed.ts ham shu fayldan oʻqiydi.
   ════════════════════════════════════════════════════════════════════ */

export type BehaviorSkill = {
  id: string;
  name: string;
  /** Apple unified emoji kodi (mas. "1f91d") — render BehaviorEmoji orqali. */
  emoji: string;
  /** Ishorali ball: ±1..±5, 0 boʻlmaydi. */
  points: number;
  /** Qaysi aniq kuzatiladigan harakat nazarda tutilishi (Daisy: aniqlik). */
  description?: string;
};

/** Avto-event manbasi; maydon yoʻqligi = qoʻlda berilgan (manual). */
export type BehaviorAutoSource = "attendance" | "streak" | "grade";

export type BehaviorEvent = {
  id: string;
  studentId: string;
  /** Koʻnikma oʻchirilgan boʻlishi mumkin — tarix snapshot'dan oʻqiladi. */
  skillId?: string;
  /** Avtomatik yaratilgan eventlarda toʻldiriladi (reconciler faqat shularga tegadi). */
  source?: BehaviorAutoSource;
  /* ── koʻnikma snapshot'i ── */
  name: string;
  emoji: string;
  description?: string;
  points: number;
  /* ──────────────────────── */
  date: string; // "YYYY-MM-DD"
  createdAt: string; // ISO
  note?: string;
  /** 2+ oʻquvchiga birga berilgan boʻlsa — umumiy id (label emas, sonini renderda hisoblaymiz). */
  groupId?: string;
};

/** Oʻchirish jurnali yozuvi — append-only audit-trail (behavior_deletions
    jadvaliga sinxronlanadi; UI'da hozircha koʻrsatilmaydi). */
export type BehaviorDeletionLogEntry = {
  id: string;
  classId: string;
  studentId: string;
  /** Oʻchirilgan event id — event qatori DBdan oʻchadi, snapshot shu yerda qoladi. */
  eventId: string;
  name: string;
  emoji: string;
  points: number;
  /** Event sanasi ("YYYY-MM-DD"), oʻchirilgan payt emas. */
  date: string;
  reason?: string;
  deletedAt: string; // ISO
};

export type BehaviorReward = {
  id: string;
  name: string;
  emoji: string;
  /** Ball narxi, > 0. */
  cost: number;
};

export type BehaviorRedemption = {
  id: string;
  classId: string;
  studentId: string;
  /** Erkin sarflashda boʻlmaydi (mukofot roʻyxatdan tashqari). */
  rewardId?: string;
  /* ── mukofot snapshot'i (erkin sarflashda name = izoh matni) ── */
  name: string;
  emoji: string;
  cost: number;
  /* ───────────────────────────────────────────────────────────── */
  date: string; // "YYYY-MM-DD"
  createdAt: string; // ISO
};

/* ── Avtomatik ballar sozlamasi ─────────────────────────────────────── */

/** Davomat/jurnal → xulq avto-ball qoidalari (ekspert-konsultatsiya defaultlari).
    `*Since` — qoida yoqilgan sana: reconciler undan oldingi sanalarga tegmaydi
    (yarim yilda yoqilganda retro-toshqin boʻlmasin). */
export type BehaviorAutoSettings = {
  attendanceEnabled: boolean;
  /** Har qoida oʻqituvchi tomonidan mustaqil yoqib-oʻchiriladi (default yoniq). */
  lateEnabled: boolean;
  latePoints: number; // manfiy
  absentEnabled: boolean;
  absentPoints: number; // manfiy (sababsiz)
  presentEnabled: boolean;
  presentPoints: number; // musbat
  /** Davomat seriyasi (zina modeli): streakN = bazaviy marra B
      (B→+2, 2B→+3, 4B→+5, keyin har 2B→+5 — bonus engine'da hisoblanadi). */
  streakEnabled: boolean;
  streakN: number;
  /** @deprecated Zina modeli (v2) bonusni oʻzi hisoblaydi; engine bu maydonni oʻqimaydi. Sync moslik uchun saqlanadi. */
  streakBonus: number;
  attendanceSince: string; // "YYYY-MM-DD"
  journalEnabled: boolean;
  gradedEnabled: boolean;
  gradedPoints: number; // musbat
  missedDueEnabled: boolean;
  missedDuePoints: number; // manfiy
  journalSince: string; // "YYYY-MM-DD"
};

export function defaultAutoSettings(sinceDate: string = todayDateKey()): BehaviorAutoSettings {
  return {
    attendanceEnabled: true,
    lateEnabled: true,
    latePoints: -1,
    absentEnabled: true,
    absentPoints: -2,
    presentEnabled: true,
    presentPoints: 1,
    streakEnabled: true,
    streakN: 5,
    streakBonus: 2,
    attendanceSince: sinceDate,
    journalEnabled: true,
    gradedEnabled: true,
    gradedPoints: 1,
    missedDueEnabled: true,
    missedDuePoints: -1,
    journalSince: sinceDate,
  };
}

/* ── Defaultlar (slug bilan — DAL deterministik id yasaydi) ─────────── */

type SkillDef = Omit<BehaviorSkill, "id"> & { slug: string };
type RewardDef = Omit<BehaviorReward, "id"> & { slug: string };

/* Qoʻlda beriladigan koʻnikmalar ±2..±5 diapazonida (±1 avtomatik
   qoidalarga ajratilgan) — inson bahosi avto-signaldan ogʻirroq turadi. */
export const DEFAULT_SKILL_DEFS: readonly SkillDef[] = [
  // Ijobiy
  { slug: "yordam",     name: "Yordam berdi",           emoji: "1f91d", points: 2, description: "Sinfdoshiga tushunishga yoki vazifani bajarishga yordam berdi" },
  { slug: "diqqat",     name: "Diqqatli boʻldi",        emoji: "1f440", points: 2, description: "Darsga eʼtiborini toʻliq qaratdi, chalgʻimadi" },
  { slug: "faol",       name: "Faol qatnashdi",         emoji: "1f64b", points: 2, description: "Savolga dalil yoki misol bilan javob berdi" },
  { slug: "jamoa",      name: "Jamoada ishladi",        emoji: "1f465", points: 2, description: "Guruh ishida vazifasini oʻz vaqtida bajardi" },
  { slug: "tirishqoq",  name: "Tirishqoqlik koʻrsatdi", emoji: "1f4aa", points: 3, description: "Qiyin masalada bosh tortmay, oxirigacha urindi" },
  { slug: "yaxshi-ish", name: "Yaxshi ishladi",         emoji: "1f31f", points: 3, description: "Topshiriqni sifatli va toʻliq bajardi" },
  // Salbiy
  { slug: "uy-vazifa-yoq", name: "Uy vazifasi yoʻq",         emoji: "1f6ab",      points: -2, description: "Uy vazifasini bajarmasdan keldi" },
  { slug: "tayyor-emas",   name: "Darsga tayyor emas",       emoji: "26a0-fe0f",  points: -2, description: "Kerakli daftar/qalam/materialsiz keldi" },
  { slug: "xalaqit",       name: "Boshqalarga xalaqit berdi", emoji: "1f5e3-fe0f", points: -2, description: "Gapirish yoki harakat bilan sinfning diqqatini boʻldi" },
  { slug: "odobsizlik",    name: "Odobsizlik qildi",         emoji: "1f620",      points: -3, description: "Xatosi koʻrsatilganda tuzatishdan bosh tortdi yoki dagʻal javob qaytardi" },
] as const;

export const DEFAULT_REWARD_DEFS: readonly RewardDef[] = [
  { slug: "joy-tanlash",  name: "Joy tanlash huquqi",                  emoji: "1fa91", cost: 10 },
  { slug: "sardor",       name: "Bir kunlik sinf sardori",             emoji: "1f451", cost: 15 },
  { slug: "vazifa-ozod",  name: "Uy vazifasidan ozod",                 emoji: "1f3ab", cost: 20 },
  { slug: "musiqa",       name: "Sinf uchun musiqa/oʻyin tanlash",     emoji: "1f3b5", cost: 25 },
] as const;

/** Deterministik id — PKlar global, teacherId qoʻshilishi shart (DAL'da). */
export function defaultSkillId(slug: string, teacherId: string): string {
  return `bhs-${slug}-${teacherId}`;
}
export function defaultRewardId(slug: string, teacherId: string): string {
  return `bhr-${slug}-${teacherId}`;
}

export function defaultSkills(teacherId?: string): BehaviorSkill[] {
  return DEFAULT_SKILL_DEFS.map(({ slug, ...s }) => ({
    id: teacherId ? defaultSkillId(slug, teacherId) : `bhs-${slug}`,
    ...s,
  }));
}

export function defaultRewards(teacherId?: string): BehaviorReward[] {
  return DEFAULT_REWARD_DEFS.map(({ slug, ...r }) => ({
    id: teacherId ? defaultRewardId(slug, teacherId) : `bhr-${slug}`,
    ...r,
  }));
}

/* ── Pure helperlar ─────────────────────────────────────────────────── */

/** Balans = Σ events.points − Σ redemptions.cost (saqlanmaydi, hisoblanadi). */
export function studentBalance(
  events: BehaviorEvent[],
  redemptions: BehaviorRedemption[],
  studentId: string
): number {
  let sum = 0;
  for (const e of events) if (e.studentId === studentId) sum += e.points;
  for (const r of redemptions) if (r.studentId === studentId) sum -= r.cost;
  return sum;
}

export type BehaviorStats = {
  /** Toʻplangan musbat ballar yigʻindisi. */
  earned: number;
  /** Yoʻqotilgan ballar yigʻindisi (musbat son). */
  lost: number;
  /** Ijobiy eventlar ulushi, % (soni boʻyicha; event boʻlmasa null). */
  positivePct: number | null;
  eventCount: number;
};

/** Berilgan eventlar toʻplami statistikasi — oʻquvchidan qatʼi nazar
    (sinf-darajali hisobot butun sinf lentasi ustida ishlatadi). */
export function eventStats(events: BehaviorEvent[]): BehaviorStats {
  let earned = 0;
  let lost = 0;
  let positiveCount = 0;
  for (const e of events) {
    if (e.points > 0) {
      earned += e.points;
      positiveCount += 1;
    } else {
      lost += -e.points;
    }
  }
  return {
    earned,
    lost,
    positivePct:
      events.length === 0 ? null : Math.round((positiveCount / events.length) * 100),
    eventCount: events.length,
  };
}

export function studentBehaviorStats(
  events: BehaviorEvent[],
  studentId: string
): BehaviorStats {
  return eventStats(events.filter((e) => e.studentId === studentId));
}

/** Sinf jami balansi ("Sinf" kartasi bubble'i). */
export function classBalance(
  events: BehaviorEvent[],
  redemptions: BehaviorRedemption[]
): number {
  let sum = 0;
  for (const e of events) sum += e.points;
  for (const r of redemptions) sum -= r.cost;
  return sum;
}

/* ── Davr filtri (hisobot) ──────────────────────────────────────────── */

export type BehaviorPeriod =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "all";

export const BEHAVIOR_PERIODS: readonly { id: BehaviorPeriod; label: string }[] = [
  { id: "today", label: "Bugun" },
  { id: "yesterday", label: "Kecha" },
  { id: "thisWeek", label: "Shu hafta" },
  { id: "lastWeek", label: "Oʻtgan hafta" },
  { id: "thisMonth", label: "Shu oy" },
  { id: "lastMonth", label: "Oʻtgan oy" },
  { id: "all", label: "Hammasi" },
] as const;

/**
 * Davr chegaralari (date-key, inklyuziv); "all" → null (filtrsiz).
 * Hafta dushanbadan boshlanadi (jadval konvensiyasi).
 */
export function periodRange(
  period: BehaviorPeriod,
  now: Date = new Date()
): { from: string; to: string } | null {
  if (period === "all") return null;
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const shift = (base: Date, days: number) => {
    const x = new Date(base);
    x.setDate(base.getDate() + days);
    return x;
  };
  const mondayOffset = (d.getDay() + 6) % 7; // Du=0 … Yak=6
  switch (period) {
    case "today":
      return { from: todayDateKey(d), to: todayDateKey(d) };
    case "yesterday": {
      const y = shift(d, -1);
      return { from: todayDateKey(y), to: todayDateKey(y) };
    }
    case "thisWeek":
      return { from: todayDateKey(shift(d, -mondayOffset)), to: todayDateKey(d) };
    case "lastWeek": {
      const mon = shift(d, -mondayOffset - 7);
      return { from: todayDateKey(mon), to: todayDateKey(shift(mon, 6)) };
    }
    case "thisMonth":
      return {
        from: todayDateKey(new Date(d.getFullYear(), d.getMonth(), 1)),
        to: todayDateKey(d),
      };
    case "lastMonth":
      return {
        from: todayDateKey(new Date(d.getFullYear(), d.getMonth() - 1, 1)),
        to: todayDateKey(new Date(d.getFullYear(), d.getMonth(), 0)),
      };
  }
}

/** Davr boʻyicha filtr — date-key satrlari leksikografik solishtiriladi. */
export function filterEventsByPeriod(
  events: BehaviorEvent[],
  period: BehaviorPeriod,
  now: Date = new Date()
): BehaviorEvent[] {
  const range = periodRange(period, now);
  if (!range) return events;
  return events.filter((e) => e.date >= range.from && e.date <= range.to);
}

/* ── Koʻnikma kesimi (donut segmentlari) ────────────────────────────── */

export type SkillSlice = {
  /** Guruh kaliti: skillId yoki (oʻchirilgan koʻnikma uchun) snapshot nomi. */
  key: string;
  name: string;
  emoji: string;
  /** Necha marta berilgan. */
  count: number;
  /** Ballar yigʻindisi (ishorali). */
  points: number;
  positive: boolean;
};

/** Eventlarni koʻnikma boʻyicha guruhlaydi — ijobiylar avval, count kamayishida. */
export function skillBreakdown(events: BehaviorEvent[]): SkillSlice[] {
  const map = new Map<string, SkillSlice>();
  for (const e of events) {
    const positive = e.points > 0;
    const key = `${positive ? "p" : "n"}:${e.skillId ?? `snap-${e.name}`}`;
    const cur = map.get(key);
    if (cur) {
      cur.count += 1;
      cur.points += e.points;
      // Snapshot yangilangan boʻlishi mumkin — oxirgi nom/emoji gʻolib.
      cur.name = e.name;
      cur.emoji = e.emoji;
    } else {
      map.set(key, { key, name: e.name, emoji: e.emoji, count: 1, points: e.points, positive });
    }
  }
  return [...map.values()].sort((a, b) => {
    if (a.positive !== b.positive) return a.positive ? -1 : 1;
    return b.count - a.count;
  });
}

/* ── Mayda utilitalar ───────────────────────────────────────────────── */

export function uid(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}

/** Mahalliy vaqt boʻyicha "YYYY-MM-DD". */
export function todayDateKey(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
