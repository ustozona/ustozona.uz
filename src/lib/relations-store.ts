"use client";

/* ════════════════════════════════════════════════════════════════════
   QARINDOSHLIK STORE — yoʻnalishsiz bogʻlar (8-bosqich migratsiyasi).

   Manba endi Postgres (student_relations jadvali): `RelationsServerSync`
   (dashboard layout) mount'da serverdan {links}ni yuklaydi (hydration),
   keyin har oʻzgarishni snapshot sifatida server action'ga yuboradi.
   localStorage OLIB TASHLANDI — eski `ems.relations.v1` kaliti endi
   oʻqilmaydi (9-bosqichda tozalanadi); tablararo `storage` sinxroni ham
   ketdi (boshqa store'lar bilan bir xil — server haqiqat manbai).

   Tashqi API oʻzgarmagan: linkRelatives/unlinkRelatives/useRelatives.
   Juft kaliti: "a|b" (a < b satr tartibida — normallashtirish).
   ════════════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useState } from "react";
import { create } from "zustand";

const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

interface RelationsState {
  links: string[];
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
  link: (a: string, b: string) => void;
  unlink: (a: string, b: string) => void;
}

// Boshlangʻich holat BOʻSH — server (student_relations) haqiqat manbai;
// demo juftliklar scripts/seed.ts orqali bazada.
export const useRelationsStore = create<RelationsState>()((set) => ({
  links: [],
  _hasHydrated: false,
  setHasHydrated: (v) => set({ _hasHydrated: v }),

  link: (a, b) => {
    if (a === b) return;
    const k = pairKey(a, b);
    set((s) => (s.links.includes(k) ? s : { links: [...s.links, k] }));
  },

  unlink: (a, b) => {
    const k = pairKey(a, b);
    set((s) => ({ links: s.links.filter((x) => x !== k) }));
  },
}));

export function linkRelatives(a: string, b: string) {
  useRelationsStore.getState().link(a, b);
}

export function unlinkRelatives(a: string, b: string) {
  useRelationsStore.getState().unlink(a, b);
}

function relativesFrom(links: string[], studentId: string): string[] {
  const out: string[] = [];
  for (const k of links) {
    const [a, b] = k.split("|");
    if (a === studentId) out.push(b);
    else if (b === studentId) out.push(a);
  }
  return out;
}

/** Berilgan oʻquvchining qarindoshlari (id roʻyxati, qoʻshilish tartibida) */
export function relativesOf(studentId: string): string[] {
  return relativesFrom(useRelationsStore.getState().links, studentId);
}

/** Qarindoshlar roʻyxati (reaktiv). Hidratsiya mosligi uchun mountʼdan keyin toʻladi. */
export function useRelatives(studentId: string): string[] {
  const links = useRelationsStore((s) => s.links);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return useMemo(
    () => (mounted ? relativesFrom(links, studentId) : []),
    [studentId, links, mounted]
  );
}
