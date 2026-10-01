/* ════════════════════════════════════════════════════════════════════
   «BUGUN» VIDJETI — kunlik dars jadvali (docs/doska-referens-koriklari.md
   R409). Tiplar shu yerda — `"use server"` fayldan tip eksport qilinmaydi.
   ════════════════════════════════════════════════════════════════════ */

/**
 * Bugungi bitta dars — kun boshidan daqiqalarda, sinf nomi bilan.
 * `title` va `steps` — shu soatga rejalangan dars boʻlsa (planner):
 * dars nomi va matnidagi sarlavhalar (bosqichlar).
 */
export type TodayLesson = {
  startMin: number;
  endMin: number;
  className: string;
  title?: string;
  steps?: string[];
};

/** Bosqichlar soni chegarasi — vidjetga sigʻadigan. */
export const MAX_STEPS = 8;

/**
 * Dars matnidan (HTML) bosqichlar: 1–3-darajali sarlavhalar, tartib bilan.
 * Oʻqituvchi dars rejasini «Salomlashish / Uy vazifasi / Yangi mavzu»
 * sarlavhalari bilan yozadi — ular dars bosqichlari.
 */
export function stepsFromHtml(html: string): string[] {
  const out: string[] = [];
  const re = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < MAX_STEPS) {
    const text = m[1]
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
    if (text) out.push(text.slice(0, 80));
  }
  return out;
}

/**
 * `holiday` — bugun taʼtil yoki bayram (oʻquv kalendaridan): darslar
 * boʻsh, vidjet uning nomini koʻrsatadi.
 */
export type DoskaTodayResult =
  | { status: "ok"; lessons: TodayLesson[]; holiday?: string }
  | { status: "none" };

export function fmtMin(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}
