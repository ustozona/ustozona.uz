"use client";

import { useCallback, useState } from "react";
import type { RunSummary } from "@/lib/launch-types";
import { LaunchDialog, type LaunchPreset } from "./LaunchDialog";
import { RunMonitor } from "./RunMonitor";
import { PultRunner } from "./PultRunner";

/* ════════════════════════════════════════════════════════════════════
   OʻTKAZISH OQIMI — uchta oyna, bitta boshqaruv.

   Topshiriqlar sahifasi, topshiriq muharriri, test banki va Oʻyinlar
   sahifasi — hammasi AYNAN shu oqimni ishlatadi: oʻtkazish oynasi
   («Darsda oʻtkazish» / «Uyga berish») → natija ekrani (yoki pult). Har sirt oʻz nusxasini chizadi (global
   store emas): muharrir Topshiriqlar sahifasi ustida ochiq turganda
   ikkita umumiy oyna bir-birining ustiga chiqib qolmasin.

   `onChanged` — «Hozir ochiq» roʻyxati yangilanishi kerak boʻlgan har
   oʻzgarishda (sessiya ochildi, yopildi, jurnalga yozildi).
   ════════════════════════════════════════════════════════════════════ */

type LaunchState = { classId: string | null; preset?: LaunchPreset } | null;

export function useLaunchFlow({
  onChanged,
  onOpenBank,
  onCreateNew,
}: {
  onChanged?: () => void;
  /** «Qaysi test?» qadamida — bankdan olish. */
  onOpenBank?: () => void;
  /** «Qaysi test?» qadamida — yangi test tuzish. */
  onCreateNew?: () => void;
} = {}) {
  const [launch, setLaunch] = useState<LaunchState>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [pult, setPult] = useState<{ setId: string; classId: string } | null>(null);

  const openLaunch = useCallback((classId: string | null, preset?: LaunchPreset) => {
    setLaunch({ classId, preset });
  }, []);
  const openRun = useCallback((sessionId: string) => setRunId(sessionId), []);

  const element = (
    <>
      {launch && (
        <LaunchDialog
          classId={launch.classId}
          preset={launch.preset}
          onClose={() => setLaunch(null)}
          onStarted={(run: RunSummary) => {
            setLaunch(null);
            setRunId(run.sessionId);
            onChanged?.();
          }}
          onPult={(setId, classId) => {
            setLaunch(null);
            setPult({ setId, classId });
          }}
          onOfflineApplied={(sessionId) => {
            setLaunch(null);
            setRunId(sessionId);
            onChanged?.();
          }}
          onOpenBank={
            onOpenBank
              ? () => {
                  setLaunch(null);
                  onOpenBank();
                }
              : undefined
          }
          onCreateNew={
            onCreateNew
              ? () => {
                  setLaunch(null);
                  onCreateNew();
                }
              : undefined
          }
        />
      )}
      {runId && (
        <RunMonitor
          key={runId}
          sessionId={runId}
          onClose={() => setRunId(null)}
          onChanged={onChanged}
          onOpenPult={(setId, classId) => {
            setRunId(null);
            setPult({ setId, classId });
          }}
        />
      )}
      {pult && (
        <PultRunner
          setId={pult.setId}
          classId={pult.classId}
          onClose={() => setPult(null)}
          onSaved={(sessionId) => {
            setPult(null);
            setRunId(sessionId);
            onChanged?.();
          }}
        />
      )}
    </>
  );

  return { openLaunch, openRun, element };
}
