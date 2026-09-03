"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Gamepad2, Info, Layers, Printer, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { startSessionAction } from "@/server/actions/assess-sessions";
import { syncRosterAction, syncTestsAction } from "@/server/actions/lessonlab-sync";
import type { SyncOutcome } from "@/lib/sync-types";
import type { QuizSessionRow, SyncReportDetail } from "@/server/db/schema";
import type { SetContentSummary } from "@/lib/baholash-shells";
import DeliveryPanel, { type Delivery } from "./DeliveryPanel";

/* ════════════════════════════════════════════════════════════════════
   USTOZONA BAHOLASH — oʻqituvchi ish maydoni

   Test BU YERDA TUZILMAYDI. Tuzish Topshiriqlar boʻlimida qoladi
   (`/dashboard/assignments`) — u yerda muharrir bor va uni ikkinchi
   marta yozish dublikat boʻlardi. Bu sahifa faqat YETKAZISHGA javob
   beradi: tayyor testni sinfga qanday berish.

   Uchta usul, uchtasi ham bir xil sessiyaga ulanadi va bir xil
   javob jadvaliga yozadi — natija jurnalda birlashadi:

     1. Jonli oʻyin   — LessonLab oʻyin qobigʻi (arqon, poyga, ...)
     2. Uy vazifasi   — oddiy roʻyxat ekrani (/play/KOD)
     3. Qogʻoz test   — OMR: chop etiladi, telefon kamerasi tekshiradi
   ════════════════════════════════════════════════════════════════════ */

export type ClassOption = { id: string; name: string };

export type SetOption = {
  id: string;
  /** Qayerda tuzilgani — `null` = sinfsiz (kutubxonada yashaydi). */
  classId: string | null;
  title: string;
  purpose: "formative" | "summative";
  itemCount: number;
  /** Qobiq mosligini hisoblash uchun kontent xulosasi (serverdan). */
  content: SetContentSummary;
};

export type ImportStatus = {
  state: string | null;
  classes: number;
  students: number;
  tests: number;
  /** Bogʻlangan test yangilandi (botdagi tuzatish koʻchdi).
      `test_links` bilan qoʻshildi — usiz yangilangan test hech qayerda
      koʻrinmasdi va oʻqituvchi «hech narsa boʻlmadi» deb oʻylardi. */
  updated: number;
  conflicts: number;
  skipped: number;
  /** Nomi va sababi bilan — `sync_reports` dan. Son yetarli emasligi
      2026-08 da o'lchangan: 25 test jimgina tashlangan va faqat son
      ko'ringani uchun nosozlik uzoq vaqt sezilmagan. */
  details?: SyncReportDetail[];
};

type Props = {
  importStatus?: ImportStatus;
  classes: ClassOption[];
  sets: SetOption[];
  /** LessonLab dvigateli sozlanganmi (imzo kalitlari oʻrnatilganmi). */
  engineReady: boolean;
  /** Oʻyin qobiqlari serveri manzili berilganmi. */
  gamesReady: boolean;
};

export default function BaholashWorkspace({
  classes, sets, engineReady, gamesReady, importStatus,
}: Props) {
  const [classId, setClassId] = useState<string>(classes[0]?.id ?? "");
  const [activeSet, setActiveSet] = useState<SetOption | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [session, setSession] = useState<QuizSessionRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Test sinfga BOGʻLANMAGAN — bu ataylab.

     LessonLabda test oʻqituvchiniki, sinfniki emas: `bot_tests` da
     class ustuni umuman yoʻq, sinf esa test ISHLATILAYOTGANDA
     tanlanadi. Oʻqituvchi bir marta tuzgan «Irregular verbs» ni ham
     6-A, ham 8-B da ishlatadi — bu eng koʻp soʻralgan qulaylik.

     Ustozonada ham buni qilish mumkin, chunki ijro allaqachon SESSIYA
     sinfiga tayanadi, toʻplam sinfiga emas:
       • `play/join.ts`  — roʻyxat `session.classId` dan
       • `publish.ts`    — baho `session.classId` ga
     `activitySets.classId` faqat «qayerda tuzilgan» degan maʼlumot.
     Shuning uchun sxema oʻzgartirilmadi, faqat roʻyxat filtri olindi.

     Tartib: tanlangan sinfda tuzilganlari tepada — oʻqituvchi odatda
     oʻshalarni qidiradi, qolganlari esa yoʻqolmaydi. */
  const visibleSets = useMemo(() => {
    const own = sets.filter((s) => s.classId === classId);
    const other = sets.filter((s) => s.classId !== classId);
    return [...own, ...other];
  }, [sets, classId]);

  const classNameById = useMemo(
    () => new Map(classes.map((c) => [c.id, c.name])),
    [classes]
  );

  async function choose(set: SetOption, mode: Delivery) {
    setError(null);
    setActiveSet(set);
    setDelivery(mode);
    setSession(null);
    // Qogʻoz test sessiyasiz ishlaydi — varaq chop etiladi, natija
    // keyinroq skanerdan keladi.
    if (mode === "paper") return;
    setBusy(true);
    try {
      // TANLANGAN sinf — `set.classId` EMAS. Test qayerda tuzilganidan
      // qatʼi nazar, sessiya oʻqituvchi hozir tanlagan sinfga ochiladi.
      setSession(await startSessionAction({ setId: set.id, classId, title: set.title }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sessiya ochilmadi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2">
        <Badge variant="outline" className="w-fit text-muted-foreground">
          Ustozona Baholash
        </Badge>
        <h1 className="text-2xl font-semibold sm:text-3xl">Testni sinfga berish</h1>
        <p className="text-muted-foreground">
          Test{" "}
          <Link href="/dashboard/assignments" className="underline underline-offset-2">
            Topshiriqlar
          </Link>{" "}
          boʻlimida tuziladi. Bu yerda uni QAYSI sinfga va QANDAY yetkazishni
          tanlaysiz — har test istalgan sinfga berilishi mumkin, natija esa
          uchala usulda ham bitta jurnalga tushadi.
        </p>
      </header>

      <ImportPanel
        status={importStatus}
        hasClasses={classes.length > 0}
        classId={classId}
      />

      {classes.length === 0 ? (
        <EmptyNote text="Avval sinf qoʻshing — testni kimga berishni shundan keyin tanlaysiz." />
      ) : (
        <>
          {/* Sinf — YETKAZISH manzili, test filtri emas. Nomlash muhim:
              ilgari bu roʻyxat testlarni ham filtrlardi va oʻqituvchi
              «6-A ni tanlasam boshqa testlarim yoʻqoladi» deb oʻylardi. */}
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Qaysi sinfga beriladi:</p>
            <div className="flex flex-wrap gap-2">
            {classes.map((c) => (
              <Button
                key={c.id}
                size="sm"
                variant={c.id === classId ? "default" : "outline"}
                onClick={() => {
                  setClassId(c.id);
                  setActiveSet(null);
                  setDelivery(null);
                  setSession(null);
                }}
              >
                {c.name}
              </Button>
            ))}
            </div>
          </div>

          {visibleSets.length === 0 ? (
            <EmptyNote
              text="Hali test yoʻq."
              action={
                <Button asChild size="sm" variant="outline">
                  <Link href={`/dashboard/assignments?class=${classId}`}>Test tuzish</Link>
                </Button>
              }
            />
          ) : (
            /* `key={classId}` — sinf almashganda React roʻyxatni QAYTA
               yaratadi, shuning uchun kirish animatsiyasi har tanlovda
               qaytadan oʻynaydi. Kalitsiz React eski elementlarni qayta
               ishlatardi va animatsiya faqat birinchi marta koʻrinardi. */
            <ul
              key={classId}
              className="animate-in fade-in slide-in-from-top-2 divide-y divide-border rounded-xl border border-border duration-300"
            >
              {visibleSets.map((set) => (
                <li key={set.id} className="flex flex-col">
                <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Layers className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{set.title}</span>
                  {/* Boshqa sinfda tuzilgan bo'lsa — qayerdan kelgani
                      ko'rsatiladi. Yashirmaslik kerak: o'qituvchi bir xil
                      nomli ikki testni ajrata olishi shart. */}
                  {set.classId !== classId && (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      {set.classId === null
                        ? "materiallardan"
                        : `${classNameById.get(set.classId) ?? "boshqa sinf"}dan`}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    {set.purpose === "summative" ? "Summativ" : "Formativ"}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    {set.itemCount} savol
                  </Badge>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" disabled={busy}
                            onClick={() => choose(set, "game")}>
                      <Gamepad2 className="size-3.5" /> Jonli oʻyin
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy}
                            onClick={() => choose(set, "homework")}>
                      <Radio className="size-3.5" /> Uy vazifasi
                    </Button>
                    <Button size="sm" variant="outline" disabled={busy}
                            onClick={() => choose(set, "paper")}>
                      <Printer className="size-3.5" /> Qogʻoz test
                    </Button>
                  </div>
                </div>

                {/* Panel AYNAN shu test tagida ochiladi.
                    Ilgari u sahifaning eng pastida chiqardi va roʻyxat
                    uzun boʻlganda oʻqituvchi qaysi testni tanlaganini
                    koʻrmasdi — havola qaysi testniki ekani noaniq
                    boʻlardi. Yaqinlik oʻzi bogʻlanishni koʻrsatadi,
                    hech qanday izoh kerak emas. */}
                {activeSet?.id === set.id && delivery && (
                  <div className="animate-in fade-in slide-in-from-top-1 border-t border-border bg-muted/30 px-4 py-4 duration-200">
                    <DeliveryPanel
                      set={activeSet}
                      delivery={delivery}
                      session={session}
                      busy={busy}
                      engineReady={engineReady}
                      gamesReady={gamesReady}
                      classId={classId}
                      onClose={() => {
                        setActiveSet(null);
                        setDelivery(null);
                        setSession(null);
                      }}
                    />
                  </div>
                )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

    </main>
  );
}

/* LessonLab'dan koʻchirish — bir martalik import.

   Nega alohida blok: oʻqituvchi LessonLab botida yillar davomida sinf
   va oʻquvchi yigʻgan boʻlishi mumkin. Ularni qoʻlda kiritish yuzlab
   ism yozish degani va Ustozonaga oʻtishning eng katta toʻsigʻi. */
function ImportPanel({ status, hasClasses, classId }:
                     { status?: ImportStatus; hasClasses: boolean; classId: string }) {
  const [syncing, setSyncing] = useState(false);
  const [live, setLive] = useState<SyncOutcome | null>(null);

  /* Toʻgʻridan sinxronizatsiya; `not_linked` boʻlsa eski OAuth yoʻliga.

     ⚠️ `not_linked` XATO EMAS — bu oʻqituvchi hali Telegram'ni
     bogʻlamagan degani va u yerda rozilik HAQIQATAN kerak. Shuning
     uchun xato koʻrsatilmaydi, jimgina toʻgʻri yoʻlga yuboriladi. */
  async function runSync(fn: () => Promise<SyncOutcome>, fallback: string) {
    setSyncing(true);
    try {
      const out = await fn();
      if (!out.ok && out.reason === "not_linked") {
        window.location.href = fallback;
        return;
      }
      setLive(out);
    } finally {
      setSyncing(false);
    }
  }

  const s = status?.state ?? null;

  const message = (() => {
    /* Jonli sinxronizatsiya natijasi URL'dagi eski holatdan USTUN —
       aks holda o'qituvchi tugmani bosib, ekranda avvalgi importning
       xabarini ko'rib turardi. */
    if (live) {
      if (!live.ok) return "Sinxronlab boʻlmadi — keyinroq urinib koʻring.";
      const parts: string[] = [];
      if (live.classesCreated) parts.push(`${live.classesCreated} sinf`);
      if (live.studentsCreated) parts.push(`${live.studentsCreated} oʻquvchi`);
      if (live.testsCreated) parts.push(`${live.testsCreated} test`);
      if (live.testsUpdated) parts.push(`${live.testsUpdated} test yangilandi`);
      if (!parts.length) return "Hammasi joyida — yangi narsa yoʻq.";
      return `Sinxronlandi: ${parts.join(", ")}`;
    }
    if (s === "ok") {
      const parts: string[] = [];
      if (status?.classes) parts.push(`${status.classes} sinf`);
      if (status?.students) parts.push(`${status.students} oʻquvchi`);
      if (status?.tests) parts.push(`${status.tests} test`);
      // Yangilangan test ALOHIDA aytiladi: «ko'chirildi» deb qo'shib
      // yuborish noto'g'ri bo'lardi — bu yangi test emas, botda
      // tuzatilgan eski testning Ustozonaga o'tishi.
      if (status?.updated) parts.push(`${status.updated} test yangilandi`);
      // Hech narsa koʻchmasa buni ochiq aytamiz. «Koʻchirildi: » deb
      // boʻsh roʻyxat koʻrsatish oʻqituvchini ishlagan deb adashtirardi.
      if (parts.length === 0) {
        // `skipped` ni JIM YUTMAYMIZ. Ilgari u ko'rsatilmasdi va
        // «yangi narsa topilmadi» degan xabar chiqardi — holbuki 25 ta
        // test kelib, hammasi o'tkazib yuborilgan edi (import xatosi).
        // Foydalanuvchi hech narsa yo'q deb o'ylab, nosozlikni
        // ko'rmasdi.
        if (status?.skipped) {
          return `Hech narsa koʻchmadi — ${status.skipped} ta yaroqsiz ` +
                 "deb oʻtkazib yuborildi (savoli yoki toʻgʻri javobi yoʻq).";
        }
        return status?.conflicts
          ? `Yangi narsa yoʻq — ${status.conflicts} ta nomi bir xil boʻlgani uchun tegilmadi.`
          : "Koʻchirishga yangi narsa topilmadi.";
      }
      const tail = [
        status?.conflicts ? `${status.conflicts} ta nomi bir xil boʻlgani uchun tegilmadi` : "",
        status?.skipped ? `${status.skipped} ta oʻtkazib yuborildi` : "",
      ].filter(Boolean);
      return `Koʻchirildi: ${parts.join(", ")}${tail.length ? ` · ${tail.join(" · ")}` : ""}`;
    }
    if (s === "denied") return "Ruxsat berilmadi — koʻchirish bekor qilindi.";
    if (s === "badstate") return "Havola eskirgan — qaytadan urinib koʻring.";
    /* Egalik nizosi — «koʻchirib boʻlmadi» deb umumiy xato koʻrsatish
       notoʻgʻri boʻlardi: nosozlik yoʻq, shunchaki bogʻlanish band.
       Sababi aytilmasa oʻqituvchi tugmani qayta-qayta bosardi. */
    if (s === "takentg") {
      return "Bu Telegram hisobi allaqachon BOSHQA Ustozona hisobiga " +
             "bogʻlangan — shu sababli hech narsa koʻchirilmadi. Toʻgʻri " +
             "hisob bilan kiring yoki Sozlamalar > LessonLab boʻlimida " +
             "bogʻlanishni oʻzgartiring.";
    }
    if (s === "otherlink") {
      return "Bu hisob BOSHQA Telegram hisobiga bogʻlangan — shu sababli " +
             "hech narsa koʻchirilmadi. Sozlamalar > LessonLab boʻlimida " +
             "bogʻlanishni tekshiring.";
    }
    if (s === "notconfigured") return "LessonLab ulanishi hali sozlanmagan.";
    if (s === "failed") return "Koʻchirib boʻlmadi — keyinroq qayta urinib koʻring.";
    return null;
  })();

  const details = status?.details ?? [];

  return (
    <div className="rounded-xl border border-border bg-muted/40 px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-3">
        <Info className="size-4 shrink-0 text-muted-foreground" />
        <p className="flex-1 text-sm text-muted-foreground">
          {message ?? (hasClasses
            ? "LessonLab botida sinflaringiz bormi? Ularni bir marta koʻchirib olishingiz mumkin — mavjud sinflarga tegilmaydi."
            : "LessonLab botida sinflaringiz bormi? Ularni qoʻlda kiritmang — bir marta koʻchirib oling.")}
        </p>
        {/* ⚠️ BITTA TUGMA, YOʻLNI SERVER TANLAYDI.

            Bogʻlangan oʻqituvchida OAuth ORTIQCHA: ikkala mahsulot
            bitta bazada va `user_telegram` kimlikni allaqachon
            tasdiqlagan. Ilgari har koʻchirish toʻliq rozilik zanjirini
            talab qilardi (Telegram'ga oʻtish, tugma bosish), va
            roʻyxat bilan test uchun IKKI ALOHIDA rozilik kerak edi —
            natijada sinxronizatsiya amalda hech qachon qilinmasdi.

            Endi amal `not_linked` qaytarsagina eski yoʻlga yuboriladi.
            Foydalanuvchi «qaysi yoʻl meniki?» degan savolni umuman
            koʻrmaydi. */}
        <Button size="sm" variant="outline" disabled={syncing}
                onClick={() => runSync(syncRosterAction, "/api/lessonlab/start")}>
          {syncing ? "Sinxronlanmoqda…" : "Sinflarni sinxronlash"}
        </Button>
        {/* Test sinxronlash sinfga bogʻlangan — qaysi sinfga tushishini
            bilmasdan chaqirib boʻlmaydi, shuning uchun sinf tanlanmagan
            boʻlsa tugma umuman koʻrsatilmaydi. */}
        {classId && (
          <Button size="sm" variant="outline" disabled={syncing}
                  onClick={() => runSync(
                    () => syncTestsAction(classId),
                    `/api/lessonlab/start?class=${encodeURIComponent(classId)}`
                  )}>
            Testlarni sinxronlash
          </Button>
        )}
      </div>

      {/* ⚠️ TAFSILOT — «2 ta nizo» degan SON hech narsa aytmaydi.
          2026-08 da 25 testdan 25 tasi jimgina «savoli yoʻq» deb
          tashlab yuborilgan va ekranda faqat son turgani uchun
          nosozlik uzoq vaqt koʻrinmagan. Endi nomi va sababi bilan.

          `<details>` — ochiq holatda emas: muvaffaqiyatli importda bu
          roʻyxat shovqin, kerak boʻlganda esa bir bosishda ochiladi. */}
      {details.length > 0 && (
        <details className="mt-3 border-t border-border pt-3">
          <summary className="cursor-pointer text-sm font-medium text-foreground">
            Nima oʻtmadi — {details.length} ta
          </summary>
          <ul className="mt-2 space-y-1.5">
            {details.map((d, i) => (
              <li key={i} className="flex flex-wrap gap-x-2 text-sm">
                <span
                  className={
                    d.group === "conflict"
                      ? "shrink-0 font-medium text-amber-700 dark:text-amber-500"
                      : "shrink-0 font-medium text-muted-foreground"
                  }
                >
                  {d.group === "conflict" ? "Nizo" : "Oʻtkazildi"}
                </span>
                <span className="font-medium text-foreground">{d.name}</span>
                <span className="text-muted-foreground">— {d.reason}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function EmptyNote({ text, action }: { text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3.5">
      <Info className="size-4 shrink-0 text-muted-foreground" />
      <p className="flex-1 text-sm text-muted-foreground">{text}</p>
      {action}
    </div>
  );
}
