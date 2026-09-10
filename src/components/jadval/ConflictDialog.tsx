"use client";

import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
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
import { suggestSwaps, type SwapSuggestion } from "@/lib/school-timetable-autoplace";

/* ════════════════════════════════════════════════════════════════════
   ZIDDIYAT OYNASI — qaror soʻraydi, xabar bermaydi.

   Jahon planlashtirish mahsulotlarida bu «scheduling conflict resolution
   popup» deb ataladi: cheklov buzilganda tizim ishni toʻxtatmaydi va
   jimgina ham oʻtkazmaydi — foydalanuvchidan NIMA QILISHNI soʻraydi.

   Bizda uch javob bor:
     • Almashtirish — ikkala darsning oʻrni almashadi, ziddiyat yoʻqoladi
     • Toʻsiqni koʻchirish — dastur aniq boʻsh vaqt TAKLIF qiladi
     • Baribir qoʻyish — zavuch bilib turib qoʻyadi (keyin hal qiladi)
     • Bekor qilish

   ⭐ Taklif bir qadamli va tekshirilgan: toʻsiq boʻlgan darsni oʻz sinfi
   ichidagi ANIQ boʻsh, ziddiyatsiz katakka koʻchirish. Chuqurroq zanjir
   (A→B→C) ataylab qidirilmaydi — zavuch bir qarashda tekshira olmaydigan
   taklifga ishonmaydi.

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
  onApplySuggestion,
}: {
  doc: SchoolTimetableDoc;
  proposal: ConflictProposal | null;
  onSwap: () => void;
  onForce: () => void;
  onCancel: () => void;
  onApplySuggestion: (suggestion: SwapSuggestion) => void;
}) {
  /* ⚠️ Hook shartdan OLDIN — `proposal` null boʻlganda ham chaqirilishi
     shart, aks holda React hook tartibi buziladi. */
  const suggestions = useMemo(
    () => (proposal ? suggestSwaps(doc, proposal.blockedBy) : []),
    [doc, proposal]
  );

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

        {suggestions.length > 0 && (
          <div className="flex flex-col gap-2 px-1">
            <p className="text-label">Yoki toʻsiqni koʻchiring</p>
            {suggestions.map((sg, i) => (
              <button
                key={`${sg.move.id}-${sg.to.day}-${sg.to.period}-${i}`}
                type="button"
                onClick={() => onApplySuggestion(sg)}
                className="group flex items-center gap-3 rounded-md border border-border px-3 py-2.5 text-left transition-colors duration-fast hover:border-primary hover:bg-muted/50"
              >
                <span className="text-body min-w-0 flex-1 truncate">{sg.label}</span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-fast group-hover:translate-x-0.5" aria-hidden />
              </button>
            ))}
          </div>
        )}

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
