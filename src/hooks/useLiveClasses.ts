"use client";

import { useCallback, useMemo } from "react";
import { useGradesStore } from "@/store/useGradesStore";
import type { ClassData, ClassInfo } from "@/lib/grades-data";
import type { ClassFormValues, ClassSlot } from "@/components/ClassFormModal";
import { DAYS_UZ, DAYS_UZ_SHORT } from "@/lib/localization";
import { useCalendarStore } from "@/store/useCalendarStore";
import { displayClassName, withGradeForYear } from "@/lib/class-naming";
import { useRequireLessonLabLink } from "./useRequireLessonLabLink";

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

/** Forma qiymatlari → ClassInfo. Slot kiritilmagan boʻlsa eski time saqlanadi.
    `name` HISOBLANADI (class-naming.ts) — formada nom maydoni yoʻq.
    Daraja FAOL oʻquv yili uchun yoziladi (`gradeByYear`), shu bois boshqa
    yillardagi daraja tarixi buzilmaydi. */
export function classInfoFromForm(
  id: string,
  v: ClassFormValues,
  prev?: ClassInfo
): ClassInfo {
  const time = slotsToTime(v.slots) ?? prev?.time;
  const activeYearId = useCalendarStore.getState().years.find((y) => y.isActive)?.id;
  const base: ClassInfo = {
    ...prev,
    id,
    name: displayClassName({ grade: v.grade, section: v.section, label: v.label }),
    color: v.color,
    ...(time ? { time } : {}),
    ...(v.grade != null ? { grade: v.grade } : { grade: undefined }),
    ...(v.section ? { section: v.section } : { section: undefined }),
    ...(v.label ? { label: v.label } : { label: undefined }),
    ...(v.subject ? { subject: v.subject } : {}),
    ...(v.icon ? { icon: v.icon } : {}),
  };
  return withGradeForYear(base, activeYearId, v.grade);
}

/** ClassInfo → forma boshlangʻich qiymatlari (nom maydoni yoʻq). */
export function classFormInitial(
  info: Pick<ClassInfo, "section" | "label" | "subject"> & { grade?: number | null }
): Partial<ClassFormValues> {
  return {
    grade: info.grade ?? null,
    section: info.section ?? "",
    label: info.label ?? "",
    subject: info.subject ?? "",
  };
}

/** Yangi sinf yaratish — id qaytaradi; GradesServerSync serverga yozadi.
 *
 *  ⛔ `null` QAYTISHI MUMKIN — LessonLab bog'lanishi kutilyapti.
 *  O'qituvchi darvozadagi «Keyinroq»ni bosgan bo'lsa, sinf yaratishga
 *  urinish darvozani QAYTA ochadi va yaratish bekor qilinadi
 *  (`useRequireLessonLabLink` izohi: bog'lanmagan sinf qatori paydo
 *  bo'lmasligi kerak). Chaqiruvchi `null` ni tekshirsin — tip shuning
 *  uchun `string | null`, aks holda birorta chaqiruv joyi jimgina
 *  e'tibordan chetda qolardi. */
export function useCreateClass(): (v: ClassFormValues) => string | null {
  const setClassDataMap = useGradesStore((s) => s.setClassDataMap);
  const ensureLinked = useRequireLessonLabLink();
  return useCallback(
    (v: ClassFormValues) => {
      if (!ensureLinked()) return null;
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
    [setClassDataMap, ensureLinked]
  );
}
