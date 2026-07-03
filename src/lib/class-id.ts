import type { ClassColor } from "@/lib/class-colors";

/* ════════════════════════════════════════════════════════════════════
   SINF IDENTITETI — sinf-detali sahifasining minimal koʻrinish modeli.

   Yagona sinf manbai endi useGradesStore.classDataMap (jonli,
   server-backed) — identitet ClassDetailResolver'da shu xaritadan
   quriladi. Eski ikki-roʻyxatli (classes-data ↔ grades-data) davr
   koʻpriklari olib tashlangan.
   ════════════════════════════════════════════════════════════════════ */

export type ClassIdentity = { id: string; name: string; color: ClassColor };
