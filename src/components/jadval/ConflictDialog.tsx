"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  findClass,
  findStaff,
  findSubject,
  staffShort,
  DAY_NAMES,
  type Placement,
  type SchoolTimetableDoc,
} from "@/lib/school-timetable";

/* ════════════════════════════════════════════════════════════════════
   ZIDDIYAT OYNASI — qaror soʻraydi, xabar bermaydi.

   Jahon planlashtirish mahsulotlarida bu «scheduling conflict resolution
   popup» deb ataladi: cheklov buzilganda tizim ishni toʻxtatmaydi va
   jimgina ham oʻtkazmaydi — foydalanuvchidan NIMA QILISHNI soʻraydi.

   Bizda uch javob bor:
     • Almashtirish — ikkala darsning oʻrni almashadi, ziddiyat yoʻqoladi
     • Baribir qoʻyish — zavuch bilib turib qoʻyadi (keyin hal qiladi)
     • Bekor qilish

   ⚠️ «Baribir qoʻyish» ATAYLAB bor. Jadval tuzish jarayonida vaqtinchalik
   ziddiyat normal holat — tizim uni taqiqlasa, zavuch mahsulotdan
   chiqib ketadi va qogʻozda ishlaydi.
   ════════════════════════════════════════════════════════════════════ */

export type ConflictProposal = {
  /** Qoʻyilmoqchi boʻlgan dars (yangi yoki koʻchirilayotgan). */
  subjectId: string;
  staffId: string;
  classId: string;
  day: number;
  shift: 1 | 2;
  period: number;
  /** Oʻsha vaqtda shu xodim band boʻlgan darslar. */
  blockedBy: Placement[];
  /** Oʻrin almashtirish mumkinmi (koʻchirishda va bitta toʻsiq boʻlsa). */
  canSwap: boolean;
};

export default function ConflictDialog({
  doc,
  proposal,
  onSwap,
  onForce,
  onCancel,
}: {
  doc: SchoolTimetableDoc;
  proposal: ConflictProposal | null;
  onSwap: () => void;
  onForce: () => void;
  onCancel: () => void;
}) {
  if (!proposal) return null;

  const subject = findSubject(doc, proposal.subjectId);
  const staff = findStaff(doc, proposal.staffId);
  const cls = findClass(doc, proposal.classId);
  const blocker = proposal.blockedBy[0];
  const blockerClass = blocker ? findClass(doc, blocker.classId) : null;
  const blockerSubject = blocker ? findSubject(doc, blocker.subjectId) : null;

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Oʻqituvchi band</DialogTitle>
          <DialogDescription>
            {staff ? staffShort(staff.name) : proposal.staffId} — {DAY_NAMES[proposal.day]},{" "}
            {proposal.period}-soat
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 px-1 text-body">
          <p>
            <b className="font-semibold">{cls?.name}</b> ga{" "}
            <b className="font-semibold">{subject?.name ?? proposal.subjectId}</b> qoʻymoqchisiz,
            lekin bu vaqtda oʻqituvchi{" "}
            <b className="font-semibold">{blockerClass?.name ?? "boshqa sinf"}</b> da{" "}
            {blockerSubject?.name ?? "dars"} oʻtadi.
          </p>
          {proposal.canSwap && (
            <p className="text-caption">
              Almashtirsangiz ikkala dars oʻrin almashadi va ziddiyat qolmaydi.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Bekor qilish
          </Button>
          <Button variant="outline" onClick={onForce}>
            Baribir qoʻyish
          </Button>
          {proposal.canSwap && <Button onClick={onSwap}>Oʻrnini almashtirish</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
