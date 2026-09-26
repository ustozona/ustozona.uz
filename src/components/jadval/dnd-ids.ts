import type { Armed } from "@/store/useSchoolTimetableStore";

/* ════════════════════════════════════════════════════════════════════
   @dnd-kit IDENTIFIKATORLARI.

   Bitta `DndContext` ichida ikki xil sudraladigan (qoldiq kartasi va
   joylangan dars) va bitta drop-zona (katak) bor. Naqsh `PlannerView`
   dan koʻchirilgan: prefiksli, `|` bilan ajratilgan, tahlil qilinadigan
   satr. Ajratgich id'larda uchramaydi, shuning uchun split xavfsiz.

     C| classId | subjectId | staffId            → qoldiq kartasi
     P| placementId | classId | subjectId | staffId → joylangan dars
     S| classId | day | shift | period           → katak
   ════════════════════════════════════════════════════════════════════ */

export const cardDndId = (classId: string, subjectId: string, staffId: string) =>
  `C|${classId}|${subjectId}|${staffId}`;

export const placementDndId = (
  placementId: string,
  classId: string,
  subjectId: string,
  staffId: string
) => `P|${placementId}|${classId}|${subjectId}|${staffId}`;

export const slotDndId = (classId: string, day: number, shift: 1 | 2, period: number) =>
  `S|${classId}|${day}|${shift}|${period}`;

/** Sudralayotgan element — `Armed` shakliga aylantiradi (null = notanish). */
export function parseDragged(id: string): Armed {
  const a = id.split("|");
  if (a[0] === "C") return { kind: "new", classId: a[1], subjectId: a[2], staffId: a[3] };
  if (a[0] === "P")
    return {
      kind: "move",
      placementId: a[1],
      classId: a[2],
      subjectId: a[3],
      staffId: a[4],
    };
  return null;
}

export type SlotTarget = { classId: string; day: number; shift: 1 | 2; period: number };

export function parseSlot(id: string): SlotTarget | null {
  const a = id.split("|");
  if (a[0] !== "S") return null;
  return {
    classId: a[1],
    day: Number(a[2]),
    shift: Number(a[3]) as 1 | 2,
    period: Number(a[4]),
  };
}
