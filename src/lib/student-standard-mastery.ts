/* ════════════════════════════════════════════════════════════════════
   OʻQUVCHI × STANDART OʻZLASHTIRISHI

   Zanjirning oxirgi boʻgʻini: topshiriq → standart teglash DALIL beradi,
   bu modul dalillarni bitta darajaga yigʻadi.

   ── Nega oddiy oʻrtacha EMAS ─────────────────────────────────────────
   Oʻrganish — uzoq muddatli xotiradagi oʻzgarish. Boshlovchi oʻquvchi
   dastlabki bosqichda koʻp xato qilishi TABIIY. Oddiy oʻrtacha bu
   xatolarni yakuniy darajaga surib, oʻquvchini pastga tortadi va
   motivatsiyani oʻldiradi. Shuning uchun default — SOʻNUVCHI OʻRTACHA:
   oxirgi urinish 65%, undan oldingi yigʻindi 35%.

   ── Nega qatʼiy chegara EMAS ─────────────────────────────────────────
   Eski `standards-mastery.ts` 75% chizigʻini ishlatadi. Qatʼiy kesish
   «chegara buzilishi»ni keltiradi: chiziqning ikki yonidagi amalda
   TENG ikki oʻquvchi qarama-qarshi tasniflanadi, holbuki oʻlchov xatosi
   aynan chegara atrofida eng katta. Bu yerda daraja uzluksiz 0..1
   qaytadi; tasniflash faqat koʻrsatish qatlamida.

   ── Ishonchlilik ─────────────────────────────────────────────────────
   Bitta urinish tasodifiy xatolikka moyil. `MIN_EVIDENCE` tadan kam
   dalil boʻlsa daraja UMUMAN qaytarilmaydi (`null` = «Baholanmagan»),
   chunki koʻrsatilmagan raqam notoʻgʻri raqamdan yaxshi.

   docs/standards-page-spec.md §11.2, §11.5, §12.2, §13.2
   ════════════════════════════════════════════════════════════════════ */

import type { Assignment, Grade } from "@/lib/grades-data";
import { gradePercent } from "@/lib/grades-stats";

/** Daraja koʻrsatish uchun zarur boʻlgan eng kam mustaqil dalil soni. */
export const MIN_EVIDENCE = 3;

/** Soʻnuvchi oʻrtachada oxirgi urinishning ulushi. */
export const DECAY_WEIGHT = 0.65;

export type MasteryMethod =
  /** Soʻnuvchi oʻrtacha (default) — formativ baholash uchun. */
  | "decaying"
  /** Oddiy oʻrtacha — summativ/yakuniy hisobot uchun. */
  | "mean"
  /** Oxirgi urinish. */
  | "latest"
  /** Eng yuqori natija. */
  | "highest";

export const DEFAULT_METHOD: MasteryMethod = "decaying";

export interface MasteryEvidence {
  assignmentId: string;
  /** 0..100 */
  percent: number;
  /** "yyyy-mm-dd" — tartiblash uchun; boʻsh boʻlsa oxiriga tushadi. */
  date?: string;
}

export interface StandardMastery {
  standardId: string;
  /** 0..1, yoki `null` — dalil yetarli emas. */
  level: number | null;
  evidenceCount: number;
  /** Oxirgi dalil sanasi ("yyyy-mm-dd"). */
  lastAssessed?: string;
}

/**
 * Dalillarni bitta darajaga yigʻadi (0..1).
 *
 * ⚠️ Dalillar SANA boʻyicha oʻsish tartibida kutiladi — soʻnuvchi
 * oʻrtacha tartibga bogʻliq. `masteryFor` buni oʻzi taʼminlaydi.
 */
export function aggregate(percents: number[], method: MasteryMethod): number {
  if (percents.length === 0) return 0;
  switch (method) {
    case "mean":
      return percents.reduce((s, p) => s + p, 0) / percents.length / 100;
    case "latest":
      return percents[percents.length - 1] / 100;
    case "highest":
      return Math.max(...percents) / 100;
    case "decaying": {
      /* Eng eskisidan boshlab: acc = acc*(1-w) + yangi*w.
         Birinchi qiymat toʻliq olinadi — «oldingi yigʻindi» hali yoʻq. */
      let acc = percents[0];
      for (let i = 1; i < percents.length; i++) {
        acc = acc * (1 - DECAY_WEIGHT) + percents[i] * DECAY_WEIGHT;
      }
      return acc / 100;
    }
  }
}

/** Sanasi boʻyicha oʻsish tartibi; sanasizlar oxirida (tartibi saqlanadi). */
function byDate(a: MasteryEvidence, b: MasteryEvidence): number {
  if (!a.date && !b.date) return 0;
  if (!a.date) return 1;
  if (!b.date) return -1;
  return a.date.localeCompare(b.date);
}

/**
 * Bitta oʻquvchining bitta standart boʻyicha dalillarini yigʻadi.
 *
 * Dalil = shu standartga teglangan topshiriqdagi bahosi. Q/T (kelmadi/
 * topshirmadi) va ballsiz kataklar dalil EMAS — `gradePercent` ularni
 * oʻzi chiqarib tashlaydi.
 */
export function masteryFor(
  standardId: string,
  studentId: string,
  assignments: Assignment[],
  grades: Grade[],
  method: MasteryMethod = DEFAULT_METHOD,
): StandardMastery {
  const evidence: MasteryEvidence[] = [];

  for (const a of assignments) {
    if (!a.standardIds?.includes(standardId)) continue;
    const g = grades.find((x) => x.assignmentId === a.id && x.studentId === studentId);
    const pct = gradePercent(g, a);
    if (pct === null) continue;
    evidence.push({ assignmentId: a.id, percent: pct, date: a.date });
  }

  evidence.sort(byDate);
  const lastAssessed = [...evidence].reverse().find((e) => e.date)?.date;

  return {
    standardId,
    evidenceCount: evidence.length,
    lastAssessed,
    // Ishonchlilik chegarasi — kam dalilda raqam koʻrsatilmaydi.
    level:
      evidence.length >= MIN_EVIDENCE
        ? aggregate(evidence.map((e) => e.percent), method)
        : null,
  };
}

export interface DomainMastery {
  domainId: string;
  /** 0..1, yoki `null` — bu sohada baholangan standart yoʻq. */
  level: number | null;
  /** Daraja chiqqan standartlar soni (radar oʻqi shunga tayanadi). */
  assessedStandards: number;
  /** Sohadagi jami standartlar soni — «qancha qismi oʻlchangan». */
  totalStandards: number;
}

/**
 * Soha (mazmun sohasi) darajasidagi agregat — profil radarining oʻqi.
 *
 * ⚠️ Soha darajasi standart darajalarining ODDIY oʻrtachasi: soʻnuvchi
 * oʻrtacha allaqachon standart ichida qoʻllangan, uni ikkinchi marta
 * qoʻllash vaqtni ikki karra hisoblagan boʻlardi. Baholanmagan
 * standartlar maxrajga KIRMAYDI — aks holda «oʻlchamaganimiz» «yomon
 * oʻzlashtirgan»dek koʻrinardi.
 */
export function domainMastery(
  standardIds: string[],
  studentId: string,
  assignments: Assignment[],
  grades: Grade[],
  domainId: string,
  method: MasteryMethod = DEFAULT_METHOD,
): DomainMastery {
  const levelById = new Map<string, number | null>();
  for (const id of standardIds) {
    levelById.set(id, masteryFor(id, studentId, assignments, grades, method).level);
  }
  return domainMasteryFromLevels(standardIds, levelById, domainId);
}

/**
 * Darajalar allaqachon hisoblangan boʻlsa shu variant ishlatiladi.
 *
 * Profil paneli har standart uchun `masteryFor` ni baribir chaqiradi;
 * `domainMastery` ni oʻsha yerda qayta chaqirish butun hisobni IKKI
 * KARRA bajarardi.
 */
export function domainMasteryFromLevels(
  standardIds: string[],
  levelById: Map<string, number | null>,
  domainId: string,
): DomainMastery {
  const levels: number[] = [];
  for (const id of standardIds) {
    const lvl = levelById.get(id);
    if (lvl !== null && lvl !== undefined) levels.push(lvl);
  }
  return {
    domainId,
    totalStandards: standardIds.length,
    assessedStandards: levels.length,
    level: levels.length ? levels.reduce((s, v) => s + v, 0) / levels.length : null,
  };
}
