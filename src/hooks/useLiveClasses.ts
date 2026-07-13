"use client";

import { useCallback, useMemo } from "react";
import { useGradesStore } from "@/store/useGradesStore";
import type { ClassData, ClassInfo } from "@/lib/grades-data";
import type { ClassFormValues, ClassSlot } from "@/components/ClassFormModal";
import { DAYS_UZ, DAYS_UZ_SHORT } from "@/lib/localization";

/* ════════════════════════════════════════════════════════════════════
   JONLI SINF MANBAI — statik CLASSES / CLASS_DATA oʻrnini bosadi.

   Roʻyxat useGradesStore.classDataMap'dan (server-backed) olinadi:
   getGradesPayload sinflarni sortOrder boʻyicha qaytaradi va JS obyekt
   kalitlari kiritilish tartibini saqlaydi — shu tartib roʻyxat tartibi.
   Yangi sinf setClassDataMap orqali oxiriga qoʻshiladi va grades sync
   uni avtomatik serverga yozadi.

   Yangi oʻqituvchida roʻyxat BOʻSH — isteʼmolchilar boʻsh holatga
   chidamli boʻlishi shart; skeletlar uchun useLiveClassesHydrated().
   ════════════════════════════════════════════════════════════════════ */

/** Pure helper: map → tartiblangan ClassInfo roʻyxati. `includeArchived`
    berilmasa arxivlangan sinflar (archivedAt) chiqarib tashlanadi —
    pickerlar/sidebar faqat faol sinflarni koʻrsatadi. */
export function liveClassInfos(
  map: Record<string, ClassData>,
  includeArchived = false
): ClassInfo[] {
  const infos = Object.values(map).map((cd) => cd.info);
  return includeArchived ? infos : infos.filter((c) => !c.archivedAt);
}

/** Tartiblangan jonli sinf roʻyxati (info'lar) — FAOL sinflar (arxivsiz). */
export function useLiveClasses(): ClassInfo[] {
  const map = useGradesStore((s) => s.classDataMap);
  return useMemo(() => liveClassInfos(map), [map]);
}

/** Arxivlangan sinflar (Sozlamalar/Sinflar sahifasida "tiklash" uchun). */
export function useArchivedClasses(): ClassInfo[] {
  const map = useGradesStore((s) => s.classDataMap);
  return useMemo(
    () => Object.values(map).map((cd) => cd.info).filter((c) => c.archivedAt),
    [map]
  );
}

/** Server hydration tugaganmi — skelet/boʻsh-holat farqlash uchun. */
export function useLiveClassesHydrated(): boolean {
  return useGradesStore((s) => s._hasHydrated);
}

/** Bitta sinfning toʻliq maʼlumoti (yoʻq boʻlsa undefined). */
export function useLiveClassData(id: string | null | undefined): ClassData | undefined {
  return useGradesStore((s) => (id ? s.classDataMap[id] : undefined));
}

/** Bitta sinf info'si (yoʻq boʻlsa undefined). */
export function useLiveClassInfo(id: string | null | undefined): ClassInfo | undefined {
  return useGradesStore((s) => (id ? s.classDataMap[id]?.info : undefined));
}

/* ── Sinf yaratish/tahrirlash (ClassFormModal qiymatlaridan) ─────────── */

/** Modal slotlari → "Du 09:00–10:00 · Se 11:00–12:00" satri (info.time). */
export function slotsToTime(slots: ClassSlot[]): string | undefined {
  if (slots.length === 0) return undefined;
  return slots
    .map((s) => {
      const idx = DAYS_UZ.indexOf(s.day);
      return `${idx >= 0 ? DAYS_UZ_SHORT[idx] : s.day} ${s.start}–${s.end}`;
    })
    .join(" · ");
}

/** Forma qiymatlari → ClassInfo. Slot kiritilmagan boʻlsa eski time saqlanadi. */
export function classInfoFromForm(
  id: string,
  v: ClassFormValues,
  prev?: ClassInfo
): ClassInfo {
  const time = slotsToTime(v.slots) ?? prev?.time;
  return {
    id,
    name: v.name,
    color: v.color,
    ...(time ? { time } : {}),
    ...(v.grade != null ? { grade: v.grade } : {}),
    ...(v.subject ? { subject: v.subject } : {}),
    ...(v.icon ? { icon: v.icon } : {}),
    ...(v.description ? { description: v.description } : {}),
  };
}

/** Yangi sinf yaratish — id qaytaradi; GradesServerSync serverga yozadi. */
export function useCreateClass(): (v: ClassFormValues) => string {
  const setClassDataMap = useGradesStore((s) => s.setClassDataMap);
  return useCallback(
    (v: ClassFormValues) => {
      const id = crypto.randomUUID();
      setClassDataMap((prev) => ({
        ...prev,
        [id]: {
          info: classInfoFromForm(id, v),
          students: [],
          topics: [],
          assignments: [],
          grades: [],
        },
      }));
      return id;
    },
    [setClassDataMap]
  );
}
