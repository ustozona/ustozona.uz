// Tayyor standart toʻplamlari — jahon va milliy ramkalardan (CEFR, Common Core,
// NGSS, Australian Curriculum, UK National Curriculum, OʻzDTS). Foydalanuvchi
// shulardan birini tanlab sinfiga biriktiradi (import = nusxa). Kengaytiriladigan.

import type { StandardDomain, StandardItem } from "@/lib/standards-data";
import { SUBJECTS, SUBJECT_GROUPS_BY_AREA } from "@/lib/standards-data";
import { IAT_DOMAINS, IAT_TEMPLATES } from "@/lib/standard-templates-iat";

export interface SetTemplate {
  id: string;
  /** Toʻplam nomi (mas. "English — Year 10") */
  name: string;
  /** Fan — SUBJECTS bilan mos */
  subject: string;
  /** Manba ramka, mas. "OʻzDTS" */
  source: string;
  /** Ramka kod prefiksi, mas. "IAT5" (asosiy sahifada koʻrinadi) */
  frameworkCode: string;
  /** Mamlakat */
  country: string;
  /** Hudud (ixtiyoriy — milliy/shtat) */
  region: string;
  /** Sinf/bosqich */
  grade: string;
  /** Qisqa izoh */
  blurb: string;
  /** Toʻplamdagi standartlar */
  standards: StandardItem[];
  /** Mazmun sohalari (domenlar) — nusxa olinadi (spec §14). */
  domains?: StandardDomain[];
}

export const SET_TEMPLATES: SetTemplate[] = [];

/* ── OʻzDTS · Informatika va AT (IAT), 5–11 sinf ────────────────────────────
   Yangi milliy oʻquv dasturidan (dts.rtmuzedu.uz). Har sinf alohida toʻplam:
   oʻqituvchi bitta sinf bilan ishlaydi, 288 maqsadli yaxlit roʻyxat emas.
   Maʼlumot manbai va generator: docs/dts-iat.md, scripts/gen-iat-template.js
   ─────────────────────────────────────────────────────────────────────────── */
SET_TEMPLATES.push(
  ...IAT_TEMPLATES.map<SetTemplate>((t) => ({
    id: `uzdts-iat-${t.grade}`,
    name: `Informatika va AT — DTS (${t.grade}-sinf)`,
    subject: "Informatika",
    source: "OʻzDTS",
    frameworkCode: `IAT${t.grade}`,
    country: "Oʻzbekiston",
    region: "Milliy",
    grade: `${t.grade}-sinf`,
    blurb: `${t.stage} · ${t.standards.length} oʻquv maqsadi, 6 mazmun sohasi.`,
    standards: t.standards,
    domains: IAT_DOMAINS,
  })),
);

/* ── Filtrlash yordamchilari ──────────────────────────────────── */

/** Toʻliq mamlakatlar roʻyxati — baʼzilari hozircha boʻsh (toʻplam yoʻq). */
export const ALL_COUNTRIES = [
  "Oʻzbekiston",
  "Xalqaro",
  "AQSH",
  "Buyuk Britaniya",
  "Avstraliya",
  "Kanada",
  "Rossiya",
  "Qozogʻiston",
  "Qirgʻiziston",
  "Tojikiston",
  "Turkmaniston",
  "Turkiya",
  "Germaniya",
  "Fransiya",
  "Finlyandiya",
  "Singapur",
  "Yaponiya",
  "Janubiy Koreya",
  "Xitoy",
  "Hindiston",
];

/** Toʻliq sinf/bosqich roʻyxati — Oʻzbekiston 1–11, til darajalari (CEFR), KS. */
export const ALL_GRADES = [
  ...Array.from({ length: 11 }, (_, i) => `${i + 1}-sinf`),
  "A1", "A2", "B1", "B2", "C1", "C2",
  "KS3",
  "Oʻrta bosqich",
];

/** Fanlar — maktab fanlarining toʻliq roʻyxati (standards-data SUBJECTS). */
export const ALL_SUBJECTS = [...SUBJECTS];

/** Fanlar — yoʻnalish boʻyicha guruhlangan, nom koʻrinishida (standartlar
    kutubxonasi filtri shablonlarning `subject` nomi bilan ishlaydi).
    Katalogdan hosil qilinadi — qoʻlda takrorlanmaydi. */
export const SUBJECT_GROUPS: { label: string; items: string[] }[] =
  SUBJECT_GROUPS_BY_AREA.map((g) => ({
    label: g.label,
    items: g.items.map((s) => s.label),
  }));

/** Sinf/daraja — guruhlangan (dropdown uchun). */
export const GRADE_GROUPS: { label: string; items: string[] }[] = [
  { label: "Sinflar", items: Array.from({ length: 11 }, (_, i) => `${i + 1}-sinf`) },
  { label: "CEFR darajalari", items: ["A1", "A2", "B1", "B2", "C1", "C2"] },
  { label: "Boshqa", items: ["KS3", "Oʻrta bosqich"] },
];

/** Qaysi qiymatlarda toʻplam bor (boʻsh boʻlmaganlarini belgilash uchun). */
export const NONEMPTY_COUNTRIES = new Set(SET_TEMPLATES.map((t) => t.country));
export const NONEMPTY_SUBJECTS = new Set(SET_TEMPLATES.map((t) => t.subject));


export const NONEMPTY_GRADES = new Set(SET_TEMPLATES.map((t) => t.grade));

export interface TemplateFilters {
  query?: string;
  country?: string;
  region?: string;
  subject?: string;
  grade?: string;
}

/** Berilgan filtrlar boʻyicha tayyor toʻplamlarni qaytaradi. */
export function filterTemplates(f: TemplateFilters): SetTemplate[] {
  const q = f.query?.trim().toLowerCase() ?? "";
  return SET_TEMPLATES.filter((t) => {
    if (f.country && t.country !== f.country) return false;
    if (f.region && t.region !== f.region) return false;
    if (f.subject && t.subject !== f.subject) return false;
    if (f.grade && t.grade !== f.grade) return false;
    if (q) {
      const hay = `${t.name} ${t.subject} ${t.source} ${t.frameworkCode}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
