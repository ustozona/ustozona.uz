"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeaderBar } from "@/components/ui/dialog";
import type { SyncOutcome } from "@/lib/sync-types";
import type { SyncReportDetail } from "@/server/db/schema";
import {
  importReportDetailsAction,
  syncRosterAction,
  syncTestsAction,
} from "@/server/actions/lessonlab-sync";
import { reloadGradesFromServer } from "@/components/sync/GradesServerSync";

/* ════════════════════════════════════════════════════════════════════
   LESSONLAB'DAN OLISH — sinf, oʻquvchi va testlarni bir marta koʻchirish.

   Ilgari arxivlangan `/baholash` sahifasida edi (ImportPanel). Endi
   Topshiriqlar sarlavhasidagi `⋯` menyusida — testlar aynan shu yerga
   tushadi («Tayyor testlar» guruhi).

   ⚠️ BITTA TUGMA, YOʻLNI SERVER TANLAYDI. Bogʻlangan oʻqituvchida OAuth
   ORTIQCHA: ikkala mahsulot bitta bazada va `user_telegram` kimlikni
   allaqachon tasdiqlagan. Amal `not_linked` qaytarsagina eski rozilik
   yoʻliga (`/api/lessonlab/start`) yuboriladi — bu XATO emas, oddiy holat.

   OAuth qaytishi (`/api/lessonlab/callback`) Topshiriqlarga
   `?import=<holat>&…` bilan qaytadi — sahifa shu oynani natija bilan
   ochadi (`status`).
   ════════════════════════════════════════════════════════════════════ */

export type ImportStatus = {
  state: string;
  classes: number;
  students: number;
  tests: number;
  updated: number;
  conflicts: number;
  skipped: number;
  reportId: string | null;
};

/** URL'dagi `?import=…` → holat. Yoʻq boʻlsa `null`. */
export function importStatusFromParams(params: URLSearchParams): ImportStatus | null {
  const state = params.get("import");
  if (!state) return null;
  const n = (key: string) => Number(params.get(key) ?? 0) || 0;
  return {
    state,
    classes: n("classes"),
    students: n("students"),
    tests: n("tests"),
    updated: n("updated"),
    conflicts: n("conflicts"),
    skipped: n("skipped"),
    reportId: params.get("report"),
  };
}

export const IMPORT_PARAMS = [
  "import",
  "classes",
  "students",
  "tests",
  "updated",
  "conflicts",
  "skipped",
  "report",
];

export function LessonLabSyncDialog({
  classId,
  hasClasses,
  status,
  onClose,
  onSynced,
}: {
  /** Testlar qaysi sinfga olinadi — tanlanmagan boʻlsa tugma chiqmaydi. */
  classId: string | null;
  hasClasses: boolean;
  status: ImportStatus | null;
  onClose: () => void;
  /** Yangi sinf/test keldi — sahifa roʻyxatini yangilash. */
  onSynced?: () => void;
}) {
  const t = useTranslations("LaunchHub");
  const [syncing, setSyncing] = useState(false);
  const [live, setLive] = useState<SyncOutcome | null>(null);
  const [details, setDetails] = useState<SyncReportDetail[]>([]);

  // Tafsilot — NOMI va SABABI bilan (faqat oʻz hisobotidan).
  const reportId = live?.ok ? live.reportId : status?.reportId;
  useEffect(() => {
    if (!reportId) {
      setDetails([]);
      return;
    }
    let alive = true;
    importReportDetailsAction(reportId)
      .then((rows) => alive && setDetails(rows))
      .catch(() => alive && setDetails([]));
    return () => {
      alive = false;
    };
  }, [reportId]);

  async function runSync(fn: () => Promise<SyncOutcome>, fallback: string) {
    setSyncing(true);
    try {
      const out = await fn();
      if (!out.ok && out.reason === "not_linked") {
        window.location.href = fallback;
        return;
      }
      setLive(out);
      if (out.ok) {
        // Yangi sinf va oʻquvchilar jurnal store'iga tushsin.
        await reloadGradesFromServer().catch(() => {});
        onSynced?.();
      }
    } finally {
      setSyncing(false);
    }
  }

  const parts = (c: { classes: number; students: number; tests: number; updated: number }) =>
    [
      c.classes ? t("llPartClasses", { count: c.classes }) : "",
      c.students ? t("llPartStudents", { count: c.students }) : "",
      c.tests ? t("llPartTests", { count: c.tests }) : "",
      c.updated ? t("llPartUpdated", { count: c.updated }) : "",
    ].filter(Boolean);

  const message = (() => {
    /* Jonli natija URL'dagi eski holatdan USTUN — aks holda oʻqituvchi
       tugmani bosib, ekranda avvalgi importning xabarini koʻrib turardi. */
    if (live) {
      if (!live.ok) return t("llFailedLive");
      const list = parts({
        classes: live.classesCreated,
        students: live.studentsCreated,
        tests: live.testsCreated,
        updated: live.testsUpdated,
      });
      return list.length ? t("llSynced", { parts: list.join(", ") }) : t("llNothing");
    }
    const s = status?.state ?? null;
    if (s === "ok" && status) {
      const list = parts(status);
      if (list.length === 0) {
        // `skipped` JIM YUTILMAYDI — «yangi narsa topilmadi» degan xabar
        // 25 ta test oʻtkazib yuborilganini yashirardi (2026-08).
        if (status.skipped) return t("llNothingSkipped", { count: status.skipped });
        if (status.conflicts) return t("llNothingConflicts", { count: status.conflicts });
        return t("llNothingFound");
      }
      const tail = [
        status.conflicts ? t("llTailConflicts", { count: status.conflicts }) : "",
        status.skipped ? t("llTailSkipped", { count: status.skipped }) : "",
      ].filter(Boolean);
      return t("llImported", { parts: list.join(", ") }) + (tail.length ? ` · ${tail.join(" · ")}` : "");
    }
    if (s === "denied") return t("llDenied");
    if (s === "badstate") return t("llBadState");
    if (s === "takentg") return t("llTakenTg");
    if (s === "otherlink") return t("llOtherLink");
    if (s === "notconfigured") return t("llNotConfigured");
    if (s === "failed") return t("llFailed");
    return null;
  })();

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent showCloseButton={false} className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeaderBar
          icon={<RefreshCw aria-hidden />}
          title={t("llTitle")}
          description={t("llSubtitle")}
        />
        <div className="flex max-h-[70svh] flex-col gap-4 overflow-y-auto px-6 py-5">
          <p className="text-sm text-muted-foreground">
            {hasClasses ? t("llIntroHasClasses") : t("llIntroNoClasses")}
          </p>
          {message && (
            <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
              {message}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="shadow-none"
              disabled={syncing}
              onClick={() => void runSync(syncRosterAction, "/api/lessonlab/start")}
            >
              {syncing ? t("llSyncing") : t("llSyncClasses")}
            </Button>
            {/* Test sinfga bogʻlanadi — sinf tanlanmagan boʻlsa tugma chiqmaydi. */}
            {classId && (
              <Button
                variant="outline"
                className="shadow-none"
                disabled={syncing}
                onClick={() =>
                  void runSync(
                    () => syncTestsAction(classId),
                    `/api/lessonlab/start?class=${encodeURIComponent(classId)}`,
                  )
                }
              >
                {t("llSyncTests")}
              </Button>
            )}
          </div>
          {details.length > 0 && (
            <details className="border-t border-border pt-3">
              <summary className="cursor-pointer text-sm font-medium text-foreground">
                {t("llDetails", { count: details.length })}
              </summary>
              <ul className="mt-2 flex flex-col gap-1">
                {details.map((d, i) => (
                  <li key={i} className="flex flex-wrap gap-x-2 text-sm">
                    <span
                      className={
                        d.group === "conflict"
                          ? "shrink-0 font-medium text-warning"
                          : "shrink-0 font-medium text-muted-foreground"
                      }
                    >
                      {d.group === "conflict" ? t("llConflict") : t("llSkippedLabel")}
                    </span>
                    <span className="font-medium text-foreground">{d.name}</span>
                    <span className="text-muted-foreground">— {d.reason}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
