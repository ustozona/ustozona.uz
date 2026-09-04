/* ════════════════════════════════════════════════════════════════════
   SINF KESIMIDAGI STANDARTLAR INDEKSI

   Bitta sinfga bir nechta toʻplam biriktirilgan boʻlishi mumkin, shuning
   uchun «shu sinfning standartlari va mazmun sohalari» degan savolga
   javob beradigan YAGONA joy kerak. Ilgari bu mantiq topshiriq pikeri
   va oʻquvchi profilida alohida-alohida yozilgan edi va ikkalasi ham
   sohani NOM boʻyicha kalitlagan — bir xil nomli ikki soha qoʻshilib
   ketardi.

   Ikki qatʼiy qoida:

   1. **Kalit — `id`, nom EMAS.** Nom faqat koʻrsatish uchun. Ikki
      toʻplam bir xil nomni ishlatishi mumkin (import qilingan «Algoritm
      va dasturlash» va shablondagi `AD`), lekin ular boshqa sohalar.

   2. **Tartib barqaror.** Eʼlon qilingan `StandardDomain.order` hal
      qiladi; eʼlon qilinmagan sohalar (standartda `domainId` bor, lekin
      toʻplam uni eʼlon qilmagan) doim eʼlon qilinganlardan KEYIN, oʻzaro
      esa birinchi koʻrilgan tartibda. Ilgari ularning hammasi bir xil
      `999` tartibini olib, oʻzaro joylashuvi tasodifiy boʻlardi —
      holbuki radar shakli aynan tartibga bogʻliq (spec §11.4).
   ════════════════════════════════════════════════════════════════════ */

import type { StandardItem } from "@/lib/standards-data";
import type { StandardSet } from "@/store/useStandardsStore";

export interface IndexedStandard {
  std: StandardItem;
  /** `IndexedDomain.id` — yoki `undefined` («Boʻlimsiz»). */
  domainId?: string;
  setId: string;
  setName: string;
}

export interface IndexedDomain {
  id: string;
  /** Koʻrsatiladigan nom — birinchi eʼlon qilgan toʻplamdan. */
  name: string;
  /** Shu sohaga tegishli standart kodlari (hamma toʻplamlardan). */
  standardIds: string[];
}

export interface ClassStandardIndex {
  standards: IndexedStandard[];
  /** Tartiblangan — radar oʻqlari va guruh sarlavhalari shu tartibda. */
  domains: IndexedDomain[];
}

/** Eʼlon qilinmagan sohalar shu qiymatdan boshlab tartiblanadi. */
const UNDECLARED_BASE = 1_000_000;

export function classStandardIndex(
  sets: StandardSet[],
  classIds: string[],
): ClassStandardIndex {
  const standards: IndexedStandard[] = [];
  const seen = new Set<string>();
  const domains = new Map<string, IndexedDomain & { order: number }>();

  let base = 0;
  let undeclared = 0;

  for (const set of sets) {
    if (!set.classIds.some((c) => classIds.includes(c))) continue;

    const declared = new Map((set.domains ?? []).map((d) => [d.id, d]));

    for (const std of set.standards) {
      // Bir standart ikki toʻplamda uchrasa — birinchisi qoladi.
      if (seen.has(std.id)) continue;
      seen.add(std.id);

      standards.push({
        std,
        domainId: std.domainId,
        setId: set.id,
        setName: set.name,
      });

      if (!std.domainId) continue;

      const existing = domains.get(std.domainId);
      if (existing) {
        existing.standardIds.push(std.id);
        continue;
      }

      const d = declared.get(std.domainId);
      domains.set(std.domainId, {
        id: std.domainId,
        // Eʼlon qilinmagan boʻlsa kodning oʻzi nom boʻlib turadi.
        name: d?.name ?? std.domainId,
        standardIds: [std.id],
        order: d ? base + d.order : UNDECLARED_BASE + undeclared++,
      });
    }

    base += (set.domains ?? []).length;
  }

  return {
    standards,
    domains: [...domains.values()]
      .sort((a, b) => a.order - b.order)
      .map(({ id, name, standardIds }) => ({ id, name, standardIds })),
  };
}
