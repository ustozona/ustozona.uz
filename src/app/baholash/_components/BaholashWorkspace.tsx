"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Gamepad2, Info, Layers, Printer, Radio } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { startSessionAction } from "@/server/actions/assess-sessions";
import type { QuizSessionRow } from "@/server/db/schema";
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
  classId: string;
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
  conflicts: number;
  skipped: number;
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

  const className = classes.find((c) => c.id === classId)?.name ?? "";
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
            <ul className="divide-y divide-border rounded-xl border border-border">
              {visibleSets.map((set) => (
                <li key={set.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <Layers className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{set.title}</span>
                  {/* Boshqa sinfda tuzilgan bo'lsa — qayerdan kelgani
                      ko'rsatiladi. Yashirmaslik kerak: o'qituvchi bir xil
                      nomli ikki testni ajrata olishi shart. */}
                  {set.classId !== classId && (
                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                      {classNameById.get(set.classId) ?? "boshqa sinf"}dan
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

      {activeSet && delivery && (
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
  const s = status?.state ?? null;

  const message = (() => {
    if (s === "ok") {
      const parts: string[] = [];
      if (status?.classes) parts.push(`${status.classes} sinf`);
      if (status?.students) parts.push(`${status.students} oʻquvchi`);
      if (status?.tests) parts.push(`${status.tests} test`);
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
    if (s === "notconfigured") return "LessonLab ulanishi hali sozlanmagan.";
    if (s === "failed") return "Koʻchirib boʻlmadi — keyinroq qayta urinib koʻring.";
    return null;
  })();

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3.5">
      <Info className="size-4 shrink-0 text-muted-foreground" />
      <p className="flex-1 text-sm text-muted-foreground">
        {message ?? (hasClasses
          ? "LessonLab botida sinflaringiz bormi? Ularni bir marta koʻchirib olishingiz mumkin — mavjud sinflarga tegilmaydi."
          : "LessonLab botida sinflaringiz bormi? Ularni qoʻlda kiritmang — bir marta koʻchirib oling.")}
      </p>
      <Button asChild size="sm" variant="outline">
        <a href="/api/lessonlab/start">
          {s === "ok" ? "Yana koʻchirish" : "Sinflarni koʻchirish"}
        </a>
      </Button>
      {/* Test koʻchirish sinfga bogʻlangan — qaysi sinfga tushishini
          bilmasdan chaqirib boʻlmaydi, shuning uchun sinf tanlanmagan
          boʻlsa tugma umuman koʻrsatilmaydi. */}
      {classId && (
        <Button asChild size="sm" variant="outline">
          <a href={`/api/lessonlab/start?class=${encodeURIComponent(classId)}`}>
            Testlarni koʻchirish
          </a>
        </Button>
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
