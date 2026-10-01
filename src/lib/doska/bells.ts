/* ════════════════════════════════════════════════════════════════════
   SOAT + QOʻNGʻIROQ JADVALI — «3-soat · tugashiga 12 daq»
   (docs/doska-referens-koriklari.md R408). Sof hisob.

   Budilnik qoʻlda qoʻyilmaydi: oʻqituvchining qoʻngʻiroq jadvali bor
   (dars jadvali versiyasidagi `bellConfig`), dars oxiri undan olinadi.

   ⚠️ Tiplar SHU YERDA — `"use server"` fayldan tip eksport qilinmaydi.
   ════════════════════════════════════════════════════════════════════ */

/** Bugungi bitta dars soati — kun boshidan daqiqalarda. */
export type BellPeriod = { index: number; shift: 1 | 2; startMin: number; endMin: number };

export type DoskaBellsResult = { status: "ok"; periods: BellPeriod[] } | { status: "none" };

export type BellNow =
  | { kind: "lesson"; period: BellPeriod; leftSec: number }
  | { kind: "break"; next: BellPeriod; leftSec: number }
  | null;

/**
 * Hozir dars yoki tanaffusmi va qancha qoldi. Kun boshidan soniya
 * (`nowSec`) bilan — daqiqa chegarasida «0 daq» chiqib qolmasin.
 * Birinchi darsdan oldin va oxirgisidan keyin — `null` (soat oddiy).
 */
export function bellNow(periods: readonly BellPeriod[], nowSec: number): BellNow {
  const sorted = [...periods].sort((a, b) => a.startMin - b.startMin);
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    if (nowSec >= p.startMin * 60 && nowSec < p.endMin * 60) {
      return { kind: "lesson", period: p, leftSec: p.endMin * 60 - nowSec };
    }
    const next = sorted[i + 1];
    if (next && nowSec >= p.endMin * 60 && nowSec < next.startMin * 60) {
      return { kind: "break", next, leftSec: next.startMin * 60 - nowSec };
    }
  }
  return null;
}
