"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardCheck, Plus } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import {
  Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle,
} from "@/components/ui/empty";
import { listSetsWithPublishStateAction } from "@/server/actions/assess";
import { useLiveClasses } from "@/hooks/useLiveClasses";

type Row = {
  id: string;
  title: string;
  itemCount: number;
  /** Boshqa topshiriqqa allaqachon bogʻlangan boʻlsa — uning id'si. */
  takenBy: string | null;
  /** Qayerda tuzilgani — `null` = sinfsiz (faqat kutubxonada). */
  originClassId: string | null;
};

/**
 * MAVJUD TESTNI BIRIKTIRISH.
 *
 * Nega kerak: toʻplam topshiriqdan tashqarida ham tugʻiladi — test
 * bankidan olinganda, Baholash ish maydonida tuzilganda, qoralama
 * tashlab yuborilganda. Ularning hammasi Topshiriqlar sahifasida
 * «Biriktirilmagan testlar» boʻlib turadi, lekin ilgari ularni jurnal
 * ustuniga ULASH yoʻli yoʻq edi: muharrirdagi yagona tugma HAR DOIM
 * yangi toʻplam yaratardi.
 *
 * ⚠️ Allaqachon bogʻlangan toʻplam ham roʻyxatda qoladi (faqat belgisi
 * bilan): bitta test bir necha ustunni boqishi MUMKIN — R213 dagi
 * "bitta test → koʻp yetkazish → koʻp ustun" munosabati aynan shu.
 * Bloklash oldingi/keyingi test (pre/post) naqshini oʻldirardi.
 *
 * Roʻyxat ikki boʻlim: joriy sinfda tuzilganlar va MATERIALLAR — boshqa
 * sinfda tuzilgan yoki sinfsiz toʻplamlar. Ilgari faqat birinchisi
 * koʻrinardi va 5-A uchun tuzilgan test 5-B da qaytadan tuzilardi
 * (R226). Biriktirish toʻplamning `classId` siga TEGMAYDI — u "qayerda
 * tuzilgan" degan maʼlumot; ijro `session.classId` dan boradi.
 */
export default function AttachTestDialog({
  classId,
  assignmentId,
  onPick,
  onCreateNew,
  onClose,
}: {
  classId: string;
  /** Joriy topshiriq — oʻzining halqasi "band" deb koʻrsatilmasin. */
  assignmentId: string;
  onPick: (set: { id: string; title: string }) => void;
  onCreateNew: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("AssignmentsPage");
  const liveClasses = useLiveClasses();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    let alive = true;
    // Sinfsiz chaqiruv — barcha toʻplamlar; ajratish quyida, mijozda.
    listSetsWithPublishStateAction()
      .then((list) => {
        if (!alive) return;
        const mapped = list.map((r) => ({
          id: r.set.id,
          title: r.set.title,
          itemCount: r.set.items.length,
          takenBy: r.assignmentId,
          originClassId: r.set.classId,
        }));
        // Bogʻlanmaganlari tepada — oʻqituvchi koʻpincha aynan ularni izlaydi.
        mapped.sort((a, b) => Number(Boolean(a.takenBy)) - Number(Boolean(b.takenBy)));
        setRows(mapped);
      })
      .catch(() => alive && setRows([]));
    return () => {
      alive = false;
    };
  }, []);

  const classNameById = useMemo(
    () => new Map(liveClasses.map((c) => [c.id, c.name])),
    [liveClasses]
  );
  const ownRows = (rows ?? []).filter((r) => r.originClassId === classId);
  const libraryRows = (rows ?? []).filter((r) => r.originClassId !== classId);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("attachExistingTitle")}</DialogTitle>
          <DialogDescription>{t("attachExistingDescription")}</DialogDescription>
        </DialogHeader>

        {rows === null ? (
          <div className="flex h-40 items-center justify-center">
            <Spinner className="size-5 text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <Empty className="border-0 py-6">
            <EmptyHeader>
              <EmptyMedia variant="icon"><ClipboardCheck /></EmptyMedia>
              <EmptyTitle>{t("noSetsTitle")}</EmptyTitle>
              <EmptyDescription>{t("noSetsDescription")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ScrollArea className="max-h-[50vh]">
            <div className="flex flex-col gap-4 pr-3">
              {[
                { key: "own", label: t("attachFromThisClass"), items: ownRows },
                { key: "library", label: t("attachFromLibrary"), items: libraryRows },
              ]
                .filter((group) => group.items.length > 0)
                .map((group) => (
                  <div key={group.key} className="flex flex-col gap-2">
                    {/* Sarlavha faqat ikkala boʻlim ham toʻlgan boʻlsa maʼnoli —
                        bitta boʻlim qolganda ham qoldirilgan: oʻqituvchi
                        toʻplam QAYERDAN kelayotganini bilishi kerak. */}
                    <p className="text-xs font-medium text-muted-foreground">{group.label}</p>
                    {group.items.map((row) => {
                      const taken = row.takenBy && row.takenBy !== assignmentId;
                      const origin =
                        row.originClassId === null
                          ? t("attachOriginNoClass")
                          : classNameById.get(row.originClassId);
                      return (
                        <button
                          key={row.id}
                          type="button"
                          onClick={() => onPick({ id: row.id, title: row.title })}
                          className="list-card flex items-center gap-3 p-3 text-left"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <ClipboardCheck className="size-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate text-sm font-medium text-foreground">
                              {row.title}
                            </h4>
                            {taken && (
                              <p className="truncate text-xs text-muted-foreground">
                                {t("setAlreadyUsed")}
                              </p>
                            )}
                          </div>
                          {group.key === "library" && origin && (
                            <Badge
                              variant="outline"
                              className="shrink-0 text-[10px] text-muted-foreground"
                            >
                              {origin}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className="shrink-0 text-[10px] text-muted-foreground"
                          >
                            {t("questionCount", { count: row.itemCount })}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="sm:justify-between">
          <Button variant="outline" className="gap-2" onClick={onCreateNew}>
            <Plus className="size-4" />
            {t("attachNewTest")}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t("cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
