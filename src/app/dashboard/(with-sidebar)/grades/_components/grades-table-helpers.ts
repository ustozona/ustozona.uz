// GradesTable uchun sof yordamchilar (JSX/hook yoʻq) — testlash va qayta
// ishlatish oson boʻlishi uchun asosiy komponentдан ajratilgan.

/** Oʻzbekcha kollatsiya — oʻquvchi ismи boʻyicha saralash uchun. */
export const UZ_COLLATOR = new Intl.Collator("uz", { sensitivity: "base" });

/** Toʻliq ismni ism/familiyaga ajratadi. */
export function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? { first: parts[0], last: parts.slice(1).join(" ") }
    : { first: parts[0] ?? "", last: "" };
}

const UZ_MONTHS = [
  "yan", "fev", "mar", "apr", "may", "iyn",
  "iyl", "avg", "sen", "okt", "noy", "dek",
];

/** Topshiriq sanasi (yyyy-mm-dd) → "8-sen". Sana yoʻq boʻlsa id'dan zaxira. */
export function formatDueDate(a: { id: string; date?: string }): string {
  if (a.date) {
    const [, m, d] = a.date.split("-").map(Number);
    return `${d}-${UZ_MONTHS[(m - 1) % 12]}`;
  }
  const day = (a.id.charCodeAt(a.id.length - 1) % 28) + 1;
  const m = UZ_MONTHS[(a.id.charCodeAt(0) + a.id.length) % 12];
  return `${day}-${m}`;
}

/**
 * Pedagogik signal — "Holat" diagnostikasi uchun ohang (tone) + izoh matni.
 * Summativ dalil soni, formativ-summativ farqи va oʻsish/pasayish dinamikasidan
 * kelib chiqib oʻqituvchiga tavsiya beradi.
 */
export function pedagogikSignal({
  level,
  formative,
  formativeCount,
  summativeCount,
  up,
  down,
}: {
  level: number;
  formative: number;
  formativeCount: number;
  summativeCount: number;
  up: boolean;
  down: boolean;
}): { tone: string; text: string } {
  if (summativeCount === 0)
    return { tone: "var(--muted-foreground)", text: "Hali summativ dalil yo‘q — oʻzlashtirish darajasi qoʻyilmagan." };
  if (summativeCount < 3)
    return {
      tone: "var(--warning)",
      text: `Dalillar yetarli emas (${summativeCount} ta). Ishonchli xulosa uchun yana bitta summativ ish kiriting.`,
    };
  if (formativeCount > 0 && formative - level > 8)
    return {
      tone: "var(--warning)",
      text: "Formativ (shakllantiruvchi) baholari yaxshi, summativ (xulosalovchi) baholari pastroq — bilimni mustahkamlash ustida ishlang.",
    };
  if (down)
    return {
      tone: "var(--warning)",
      text: "Oʻzlashtirishda pasayish dinamikasi. Oʻlchov xatosini hisobga olib, diagnostik suhbat tavsiya etiladi.",
    };
  if (up)
    return { tone: "var(--success)", text: "Ijobiy oʻsish dinamikasi — joriy yondashuvni davom ettiring." };
  return {
    tone: "var(--muted-foreground)",
    text: "Barqaror va ishonchli. Kichik oʻzgarishlar bilim pasayishi emas, oʻlchov shovqini boʻlishi mumkin.",
  };
}
