"use client";

import * as React from "react";
import { toast } from "sonner";
import { History, Pencil, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { TypographyMuted } from "@/components/ui/typography";
import {
  Dialog, DialogContent, DialogFooter, DialogHeaderBar,
} from "@/components/ui/dialog";
import { DateKeyPicker, fmtKey } from "@/components/ui/date-key-picker";
import { Label } from "@/components/ui/label";
import { ClassSwatch } from "@/components/ClassSwatch";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { classColor } from "@/lib/grades-data";
import { useLiveClassInfo } from "@/hooks/useLiveClasses";
import { reloadGradesFromServer } from "@/components/sync/GradesServerSync";
import { correctMoveDateAction, getMembershipHistoryAction } from "@/server/actions/workspace";
import { unwrap } from "@/lib/action-result";
import {
  EXIT_REASON_LABEL,
  type CorrectMoveDateResult,
  type ExitReason,
  type MembershipHistory,
  type MembershipHistoryMove,
  type MembershipHistoryPeriod,
} from "@/lib/membership-history";

/* ════════════════════════════════════════════════════════════════════
   PROFIL «AʼZOLIK» TABI — bola qaysi sinflarda qachon boʻlgan.

   docs/sinf-azoligi-spec.md §7. Har qator — bitta aʼzolik DAVRI:
   sinf, [birinchi kun → sinfda boʻlmagan birinchi kun), chiqish sababi.
   Koʻchirishdan kelgan davrda buyruq raqami va «Sanani tuzatish» bor:
   tuzatish hodisa boʻyicha IKKALA sinfdagi davrni birga oʻzgartiradi.
   ════════════════════════════════════════════════════════════════════ */

/** "2026-09-10" → "10.09.2026". */
const fmt = (key: string) => fmtKey(key);

function periodRange(p: MembershipHistoryPeriod): string {
  const from = p.from ? fmt(p.from) : "boshidan";
  // Yarim-ochiq oraliq: `to` — sinfda BOʻLMAGAN birinchi kun. Foydalanuvchiga
  // esa oxirgi kun koʻrsatiladi emas, buyruq sanasi — shu bois «gacha».
  const to = p.to ? `${fmt(p.to)} gacha` : "hozirgacha";
  return `${from} → ${to}`;
}

function PeriodRow({
  period,
  onCorrect,
}: {
  period: MembershipHistoryPeriod;
  onCorrect: (m: MembershipHistoryMove) => void;
}) {
  const info = useLiveClassInfo(period.classId);
  const open = period.to === null;
  const move = period.move;
  const reason = period.exitReason ? EXIT_REASON_LABEL[period.exitReason as ExitReason] : null;

  return (
    <li className="flex items-start gap-3 px-5 py-3">
      <span className="mt-2 flex size-2 shrink-0">
        {info ? (
          <ClassSwatch hex={CLASS_COLOR_HEX[classColor(info)]} />
        ) : (
          <span className="size-2 shrink-0 rounded-full bg-muted-foreground/40" />
        )}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-title-sm">{period.className}</span>
          {open && (
            <Badge variant="secondary" size="sm">
              Hozir
            </Badge>
          )}
        </div>
        <span className="text-body tabular-nums">{periodRange(period)}</span>
        {(reason || move) && (
          <span className="text-caption text-muted-foreground">
            {move
              ? move.direction === "out"
                ? `Koʻchdi → ${move.otherClassName}`
                : `Kelgan: ${move.otherClassName} dan`
              : reason}
            {move?.orderNo ? ` · buyruq ${move.orderNo}` : ""}
          </span>
        )}
      </div>
      {move?.canCorrect && (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={() => onCorrect(move)}
        >
          <Pencil aria-hidden />
          Sanani tuzatish
        </Button>
      )}
    </li>
  );
}

function CorrectDateDialog({
  move,
  onClose,
  onDone,
}: {
  move: MembershipHistoryMove | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [date, setDate] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (move) setDate(move.effectiveOn);
  }, [move]);

  async function submit() {
    if (!move || !date) return;
    setBusy(true);
    try {
      const res: CorrectMoveDateResult = unwrap(
        await correctMoveDateAction({ moveId: move.id, date })
      );
      // Store'ni qoʻlda tahrir qilmaymiz — serverdan qayta yuklaymiz
      // (sinxron diff'i aks holda oʻzgarishni qaytarib yozadi).
      await reloadGradesFromServer();
      toast.success("Buyruq sanasi tuzatildi");
      if (res.outsideAttendance > 0) {
        toast.warning(
          `${res.outsideAttendance} ta davomat yozuvi yangi oraliqdan tashqarida qoldi. Ular oʻchirilmagan, lekin sinf hisobiga kirmaydi.`
        );
      }
      onDone();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sanani tuzatib boʻlmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={move !== null} onOpenChange={(v) => (!v && !busy ? onClose() : undefined)}>
      <DialogContent showCloseButton={false} className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeaderBar
          icon={<Pencil className="size-[18px]" aria-hidden />}
          title="Buyruq sanasini tuzatish"
          description={move ? `Koʻchirish: ${move.otherClassName}` : undefined}
        />
        <div className="space-y-2 px-6 py-5">
          <Label>Buyruq sanasi</Label>
          <DateKeyPicker
            value={date}
            onChange={setDate}
            ariaLabel="Buyruq sanasi"
            className="w-full"
          />
          <p className="text-sm text-muted-foreground">
            Sana ikkala sinfda birga oʻzgaradi: eski sinfda bola shu kundan oldingi kungacha,
            yangisida shu kundan boshlab hisoblanadi. Davomat yozuvlari oʻchirilmaydi.
          </p>
        </div>
        <DialogFooter className="border-t border-border bg-muted/20 px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Bekor qilish
          </Button>
          <Button onClick={submit} disabled={busy || !date || date === move?.effectiveOn}>
            {busy ? "Saqlanmoqda…" : "Saqlash"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MembershipTab({ studentId }: { studentId: string }) {
  const [history, setHistory] = React.useState<MembershipHistory | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [correcting, setCorrecting] = React.useState<MembershipHistoryMove | null>(null);

  const load = React.useCallback(async () => {
    try {
      setHistory(unwrap(await getMembershipHistoryAction({ studentId })) as MembershipHistory);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tarixni yuklab boʻlmadi");
    }
  }, [studentId]);

  React.useEffect(() => {
    setHistory(null);
    void load();
  }, [load]);

  return (
    <Panel className="h-auto">
      <PanelHeader
        icon={<History />}
        title="Aʼzolik tarixi"
        description="Bola qaysi sinflarda qachon oʻqigan"
      />
      <PanelBody>
        {error ? (
          <TypographyMuted className="px-5 py-5 text-sm">{error}</TypographyMuted>
        ) : history === null ? (
          <TypographyMuted className="px-5 py-5 text-sm">Yuklanmoqda…</TypographyMuted>
        ) : history.periods.length === 0 ? (
          <TypographyMuted className="px-5 py-5 text-sm">
            Bu oʻquvchi hech qaysi sinfga yozilmagan.
          </TypographyMuted>
        ) : (
          <>
            {history.parallelWarning && (
              <div
                role="alert"
                className="flex items-start gap-2 border-b border-border bg-warning/10 px-5 py-3 text-caption text-foreground"
              >
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                <span>{history.parallelWarning}</span>
              </div>
            )}
            <ul className="divide-y divide-border">
              {history.periods.map((p: MembershipHistoryPeriod) => (
                <PeriodRow key={p.id} period={p} onCorrect={setCorrecting} />
              ))}
            </ul>
          </>
        )}
      </PanelBody>
      <CorrectDateDialog
        move={correcting}
        onClose={() => setCorrecting(null)}
        onDone={() => void load()}
      />
    </Panel>
  );
}
