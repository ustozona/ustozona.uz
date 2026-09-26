import { create } from 'zustand';
import type { StandardDomain, StandardItem } from '@/lib/standards-data';

/* ════════════════════════════════════════════════════════════════════
   STANDARTLAR — server-backed store (7-bosqich migratsiyasi)

   Manba endi Postgres: `StandardsServerSync` (dashboard layout) mount'da
   serverdan {sets, customSets}ni yuklaydi (hydration), keyin har
   oʻzgarishni diff qilib server action'ga yuboradi. localStorage persist
   OLIB TASHLANDI — eski `murabbiyona-standard-sets-storage` kaliti endi
   oʻqilmaydi (9-bosqichda tozalanadi).
   ════════════════════════════════════════════════════════════════════ */

/** Standartlar toʻplami (papka) — nomi, fan va bir nechta sinfga tegishli. */
export interface StandardSet {
  id: string;
  /** Papka nomi, mas. "Informatika diagnostik" */
  name: string;
  /** Fan (SUBJECTS dan) */
  subject: string;
  /** Tegishli sinflar (bir nechta boʻlishi mumkin) */
  classIds: string[];
  /** Papka ichidagi standartlar */
  standards: StandardItem[];
  /**
   * Mazmun sohalari (domenlar) — `StandardItem.domainId` shularga
   * havola qiladi. Boʻsh boʻlishi mumkin: eski toʻplamlarda umuman
   * yoʻq (JSONB hujjat — migratsiya kerak emas), va oʻqituvchi
   * soha ishlatmasa ham hech narsa buzilmaydi.
   */
  domains?: StandardDomain[];
  /** Manba: "custom" (oʻzi yaratgan) yoki ramka nomi ("CEFR", "OʻzDTS"…) */
  source?: string;
  /** Sinf/bosqich (mas. "9-sinf", "B1") */
  grade?: string;
  /** Ramka kodi (mas. "AC9E1") — asosiy sahifada badge sifatida koʻrinadi */
  frameworkCode?: string;
  /** Manba shabloni/custom-set id'si — "Added" holatini aniqlash uchun */
  templateId?: string;
}

/** Qayta ishlatiladigan custom toʻplam taʼrifi (sinfga biriktirilmagan). */
export interface CustomSet {
  id: string;
  name: string;
  subject: string;
  grade?: string;
  standards: StandardItem[];
  /** Mazmun sohalari — `StandardSet.domains` bilan bir xil maʼno. */
  domains?: StandardDomain[];
}

type CreateSetInput = {
  name: string;
  subject: string;
  classIds: string[];
  standards?: StandardItem[];
  domains?: StandardDomain[];
  source?: string;
  grade?: string;
  frameworkCode?: string;
  templateId?: string;
};

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `set_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

interface StandardsState {
  /** Hamma toʻplamlar (papkalar). Boʻsh boshlanadi. */
  sets: StandardSet[];
  /** Qayta ishlatiladigan custom toʻplamlar kutubxonasi ("Mening standartlarim"). */
  customSets: CustomSet[];

  /** Yangi papka yaratish — yaratilgan papka id'sini qaytaradi. */
  createSet: (input: CreateSetInput) => string;
  /** Papka metama'lumotlarini tahrirlash. */
  updateSet: (setId: string, patch: Partial<Pick<StandardSet, 'name' | 'subject' | 'classIds'>>) => void;
  /** Papkani oʻchirish. */
  removeSet: (setId: string) => void;

  /** Papkaga standart(lar) qoʻshish (takror kodlar tashlab yuboriladi). */
  addStandards: (setId: string, items: StandardItem[]) => void;
  /** Standartni papkadan oʻchirish. */
  removeStandard: (setId: string, code: string) => void;

  /* ── Mazmun sohalari (domenlar) ── */
  /** Toʻplam domenlari roʻyxatini toʻliq almashtiradi (tartib bilan). */
  setDomains: (setId: string, domains: StandardDomain[]) => void;
  /** Bitta domen qoʻshadi; shu id allaqachon bor boʻlsa — no-op. */
  addDomain: (setId: string, domain: Omit<StandardDomain, 'order'>) => void;
  /**
   * Domenni oʻchiradi va unga bogʻlangan standartlarni «Boʻlimsiz»
   * holatiga qaytaradi (yetim havola qolmasin).
   */
  removeDomain: (setId: string, domainId: string) => void;
  /** Standartga mazmun sohasi beradi (`undefined` → Boʻlimsiz). */
  setStandardDomain: (setId: string, code: string, domainId: string | undefined) => void;

  /* ── Custom kutubxona (Mening standartlarim) ── */
  addCustomSet: (input: { name: string; subject: string; grade?: string; standards?: StandardItem[]; domains?: StandardDomain[] }) => string;
  updateCustomSet: (id: string, patch: Partial<Pick<CustomSet, 'name' | 'subject' | 'grade'>>) => void;
  removeCustomSet: (id: string) => void;
  addStandardToCustom: (id: string, item: StandardItem) => void;
  removeStandardFromCustom: (id: string, code: string) => void;

  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useStandardsStore = create<StandardsState>()(
    (set) => ({
      sets: [],
      customSets: [],

      createSet: ({ name, subject, classIds, standards = [], domains, source, grade, frameworkCode, templateId }) => {
        const id = uid();
        // Yangi qoʻshilganda hamma standart "oʻtilmagan" deb belgilanadi.
        const items = standards.map((s) => ({ ...s, covered: false }));
        set((state) => ({
          sets: [...state.sets, { id, name, subject, classIds, standards: items, domains, source, grade, frameworkCode, templateId }],
        }));
        return id;
      },

      updateSet: (setId, patch) =>
        set((state) => ({
          sets: state.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
        })),

      removeSet: (setId) =>
        set((state) => ({ sets: state.sets.filter((s) => s.id !== setId) })),

      addStandards: (setId, items) =>
        set((state) => ({
          sets: state.sets.map((s) => {
            if (s.id !== setId) return s;
            const seen = new Set(s.standards.map((x) => x.id.toLowerCase()));
            const fresh = items.filter((it) => !seen.has(it.id.toLowerCase()));
            return fresh.length ? { ...s, standards: [...s.standards, ...fresh] } : s;
          }),
        })),

      removeStandard: (setId, code) =>
        set((state) => ({
          sets: state.sets.map((s) =>
            s.id === setId ? { ...s, standards: s.standards.filter((x) => x.id !== code) } : s,
          ),
        })),

      setDomains: (setId, domains) =>
        set((state) => ({
          sets: state.sets.map((s) =>
            s.id === setId
              ? { ...s, domains: domains.map((d, i) => ({ ...d, order: i })) }
              : s,
          ),
        })),

      addDomain: (setId, domain) =>
        set((state) => ({
          sets: state.sets.map((s) => {
            if (s.id !== setId) return s;
            const list = s.domains ?? [];
            if (list.some((d) => d.id.toLowerCase() === domain.id.toLowerCase())) return s;
            return { ...s, domains: [...list, { ...domain, order: list.length }] };
          }),
        })),

      removeDomain: (setId, domainId) =>
        set((state) => ({
          sets: state.sets.map((s) => {
            if (s.id !== setId) return s;
            return {
              ...s,
              domains: (s.domains ?? [])
                .filter((d) => d.id !== domainId)
                .map((d, i) => ({ ...d, order: i })),
              // Yetim havola qolmasin — standartlar «Boʻlimsiz»ga tushadi.
              standards: s.standards.map((x) =>
                x.domainId === domainId ? { ...x, domainId: undefined } : x,
              ),
            };
          }),
        })),

      setStandardDomain: (setId, code, domainId) =>
        set((state) => ({
          sets: state.sets.map((s) =>
            s.id === setId
              ? {
                  ...s,
                  standards: s.standards.map((x) =>
                    x.id === code ? { ...x, domainId } : x,
                  ),
                }
              : s,
          ),
        })),

      addCustomSet: ({ name, subject, grade, standards = [], domains }) => {
        const id = uid();
        set((state) => ({
          customSets: [...state.customSets, { id, name, subject, grade, standards, domains }],
        }));
        return id;
      },

      updateCustomSet: (id, patch) =>
        set((state) => ({
          customSets: state.customSets.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      removeCustomSet: (id) =>
        set((state) => ({ customSets: state.customSets.filter((c) => c.id !== id) })),

      addStandardToCustom: (id, item) =>
        set((state) => ({
          customSets: state.customSets.map((c) => {
            if (c.id !== id) return c;
            if (c.standards.some((x) => x.id.toLowerCase() === item.id.toLowerCase())) return c;
            return { ...c, standards: [...c.standards, item] };
          }),
        })),

      removeStandardFromCustom: (id, code) =>
        set((state) => ({
          customSets: state.customSets.map((c) =>
            c.id === id ? { ...c, standards: c.standards.filter((x) => x.id !== code) } : c,
          ),
        })),

      _hasHydrated: false,
      setHasHydrated: (s) => set({ _hasHydrated: s }),
    })
);
