"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  Camera, Check, IdCard, Info, Loader2, ScanLine, Smartphone, Trash2, TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createScanHandoffAction, type ScanHandoff } from "@/server/actions/baholash-scan";
import type { ScanPreview, ScanSheet } from "@/server/dal/baholash-scan";
import LiveScanner, { type LiveScanResult } from "./LiveScanner";
import CardScanner, { type CardCapture } from "./CardScanner";

/* ════════════════════════════════════════════════════════════════════
   VARAQNI SKANERLASH — qogʻoz testning qaytish yoʻli

   NEGA USTOZONADA, LessonLab jurnalida emas: javob USTOZONA jurnaliga
   tushadi. Varaqdagi QR faqat TARTIB raqamini tashiydi (1..N) va uni
   oʻquvchiga qaytarish uchun oʻsha oʻqituvchining sinf roʻyxati kerak.

   ── QURILMALAR MUAMMOSI ─────────────────────────────────────────────

   Oʻqituvchi Ustozonani NOUTBUKDA ishlatadi, kamera esa TELEFONDA.
   «Havolani telefonga yuboring» degan qadam oqimni buzadi — bu eng
   koʻp shikoyat tugʻdirgan joy.

   Shuning uchun noutbukda QR chiqadi va oʻqituvchi telefon kamerasini
   OʻZ EKRANIGA tutadi. Sahifa telefonda ochiladi, kirish talab
   qilinmaydi: kimlik imzolangan chiptada (`scan-ticket.ts`).

   Ikki kirish yoʻli, ikkalasi ham SHU komponentga tushadi:
     • noutbuk  — QR koʻrsatadi (yoki kompyuterdan fayl tanlaydi)
     • telefon  — chipta bilan ochilgan sahifa, kamera darhol

   Telegram boti UCHINCHI yoʻl boʻlishi mumkin edi, lekin `?start=`
   parametri 64 belgi bilan cheklangan va chipta unga sigʻmaydi —
   shartnoma docs/baholash-integratsiya.md §8-ter da.

   OQIM — IKKI QADAM, ATAYLAB:
     1. Surat → oʻqiladi va EKRANDA koʻrsatiladi (hech narsa yozilmaydi)
     2. Oʻqituvchi tekshiradi/tuzatadi → «Jurnalga kiritish»

   Oradagi qadam shart, chunki QR tartib raqamini tashiydi: varaq chop
   etilgandan keyin sinfga bola qoʻshilsa, raqamlar surilib varaq
   boshqa bolaga bogʻlanadi. Buni faqat oʻqituvchining koʻzi ushlaydi.
   ════════════════════════════════════════════════════════════════════ */

const LETTERS = ["A", "B", "C", "D"] as const;
/** Bundan past ishonch — «tekshiring» belgisi (server bilan bir xil). */
const LOW_CONFIDENCE = 0.6;

/** Ekrandagi varaq — serverdan kelgan holat + oʻqituvchi tuzatishlari. */
type PendingSheet = {
  key: string;
  studentId: string | null;
  problems: string[];
  blocked: boolean;
  alreadyEntered: boolean;
  answers: ScanSheet["answers"];
};

/** Jonli skaner uchun kerakli varaq maʼlumoti.

    Telefon sahifasi buni SERVERDAN tayyor holda oladi
    (`buildSheetPlan`), shuning uchun kamera ochilishidan oldin
    qoʻshimcha soʻrov kerak emas — oʻqituvchi tugmani bosishi bilan
    skanerlash boshlanadi. Toʻgʻri javoblar bu yerga KIRMAYDI. */
export type LivePlan = {
  /** Varaq QR'idagi test belgisi — begona varaqni ajratish uchun. */
  testRef: number;
  questionCount: number;
  roster: { no: number; id: string; name: string }[];
};

type Props = {
  setId: string;
  classId: string;
  /** Telefondagi sahifa uchun: cookie sessiyasi yoʻq, kimlik shu
      chiptada. Boʻlmasa — noutbukdagi oqim (QR koʻrsatiladi). */
  ticket?: string;
  /** Berilsa — «Jonli skaner» tugmasi chiqadi (faqat telefon sahifasi). */
  plan?: LivePlan;
};

export default function ScanPanel({ setId, classId, ticket, plan }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [roster, setRoster] = useState<ScanPreview["roster"]>([]);
  const [sheets, setSheets] = useState<PendingSheet[]>([]);
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState<
    { studentsAdded: number; answersSaved: number; skipped: { name: string; reason: string }[] } | null
  >(null);
  const [liveOpen, setLiveOpen] = useState(false);
  const [cardsOpen, setCardsOpen] = useState(false);

  /* Jonli skaner roʻyxatga qoʻshadi, DARHOL YOZMAYDI — tekshirish
     qadami saqlanadi (docs §8-bis). Kamera yopilgach oʻqituvchi
     hammasini bir koʻzdan kechirib «Jurnalga kiritish» ni bosadi. */
  function addLiveSheet(result: LiveScanResult) {
    if (!plan) return;
    const student = plan.roster.find((r) => r.no === result.studentRef);
    setRoster(plan.roster);
    setSheets((prev) => [
      ...prev,
      {
        key: `live-${result.studentRef}-${Date.now()}`,
        studentId: student?.id ?? null,
        problems: result.examMode
          ? ["Ismsiz imtihon varagʻi — oʻquvchini qoʻlda tanlang."]
          : student
            ? []
            : [`Roʻyxatda ${result.studentRef}-raqamli oʻquvchi yoʻq — qoʻlda tanlang.`],
        blocked: false,
        alreadyEntered: false,
        answers: Array.from({ length: plan.questionCount }, (_, i) => ({
          no: i + 1,
          letter: result.answers[i + 1] ?? null,
          // Uch kadr kelishgan — shubha yoʻq, sariq belgi chiqmasin.
          confidence: 1,
          // Qogʻozda faqat A–D bor. Variantli boʻlmagan savolni server
          // baribir tashlab yuboradi (`applyOmrScan`), shuning uchun
          // bu yerda soddalashtirish xavfsiz.
          gradable: true,
          optionCount: 4,
        })),
      },
    ]);
  }

  /** QR-kartalardan yigʻilgan javoblar ham OʻSHA roʻyxatga tushadi.

      Karta va varaq — bir xil narsaning ikki koʻrinishi: ikkalasi ham
      «kim, qaysi savolga, nima javob berdi» degan maʼlumot. Shuning
      uchun tekshirish va kiritish yoʻli bitta. */
  function addCardSheets(capture: CardCapture) {
    if (!plan) return;
    setRoster(plan.roster);
    setSheets((prev) => {
      const next = [...prev];
      for (const [studentNo, answers] of capture.byStudent) {
        const student = plan.roster.find((r) => r.no === studentNo);
        next.push({
          key: `card-${studentNo}-${Date.now()}`,
          studentId: student?.id ?? null,
          problems: student
            ? []
            : [`Roʻyxatda ${studentNo}-raqamli oʻquvchi yoʻq — qoʻlda tanlang.`],
          blocked: false,
          alreadyEntered: false,
          answers: Array.from({ length: plan.questionCount }, (_, i) => ({
            no: i + 1,
            // Javob berilmagan savol boʻsh qoladi — bola oʻsha savolda
            // kartani koʻtarmagan boʻlishi mumkin.
            letter: answers.get(i + 1) ?? null,
            confidence: 1,
            gradable: true,
            optionCount: 4,
          })),
        });
      }
      return next;
    });
  }

  /** Shu seansda allaqachon oʻqilgan varaq raqamlari — takrorlanmasin. */
  const scannedRefs = new Set(
    sheets
      .map((s) => plan?.roster.find((r) => r.id === s.studentId)?.no)
      .filter((no): no is number => typeof no === "number")
  );

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    setReport(null);
    try {
      // Suratlar KETMA-KET yuboriladi: dvigatel har rasm uchun sekin
      // ishlaydi, parallel yuborish telefon tarmogʻida ikkalasini ham
      // uzaytiradi.
      for (const file of Array.from(files)) {
        const image = await downscale(file);
        const form = new FormData();
        // Chipta boʻlsa test/sinf SERVERDA chiptadan olinadi — bu
        // qiymatlar eʼtiborga olinmaydi, lekin bir xil forma ikkala
        // yoʻlga xizmat qilsin.
        form.set("setId", setId);
        form.set("classId", classId);
        if (ticket) form.set("ticket", ticket);
        form.set("image", image, "varaq.jpg");

        const res = await fetch("/api/baholash/scan", { method: "POST", body: form });
        const data = (await res.json().catch(() => null)) as
          | { ok: true; preview: ScanPreview }
          | { ok: false; message?: string }
          | null;
        if (!res.ok || !data || !data.ok) {
          throw new Error(
            (data && "message" in data ? data.message : null) ?? `Varaq oʻqilmadi (${res.status})`
          );
        }

        setRoster(data.preview.roster);
        setWarnings(data.preview.warnings);
        setSheets((prev) => [
          ...prev,
          ...data.preview.sheets.map((s, i) => ({
            key: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
            studentId: s.studentId,
            problems: s.problems,
            blocked: s.blocked,
            alreadyEntered: s.alreadyEntered,
            answers: s.answers,
          })),
        ]);
        if (data.preview.sheets.length === 0) {
          setError(
            "Suratdan varaq oʻqilmadi. Varaq toʻliq kadrga sigʻsin, yorugʻlik " +
              "yetarli boʻlsin va burchaklardagi qora belgilar koʻrinib tursin."
          );
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Varaq oʻqilmadi");
    } finally {
      setBusy(false);
      // Bir xil faylni qayta tanlash ham `change` hodisasini bersin.
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  /** Kiritishga tayyor varaqlar — oʻquvchisi bor va toʻsilmagan. */
  const ready = sheets.filter((s) => s.studentId && !s.blocked && !s.alreadyEntered);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      /* Server action EMAS, route: bu bosqich telefondan ham
         chaqiriladi va u yerda cookie sessiyasi yoʻq — kimlik
         chiptadan keladi. */
      const res = await fetch("/api/baholash/scan/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket,
          setId,
          classId,
          sheets: ready.map((s) => ({
            studentId: s.studentId as string,
            answers: Object.fromEntries(s.answers.map((a) => [String(a.no), a.letter])),
          })),
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: true; report: NonNullable<typeof report> }
        | { ok: false; message?: string }
        | null;
      if (!res.ok || !data || !data.ok) {
        throw new Error(
          (data && "message" in data ? data.message : null) ?? `Kiritilmadi (${res.status})`
        );
      }
      setReport(data.report);
      // Kiritilgan varaqlar roʻyxatdan chiqadi — ikkinchi marta
      // bosilsa dublikat boʻlmasin.
      setSheets((prev) => prev.filter((s) => !ready.includes(s)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kiritilmadi");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      {/* Telefonda ochilgan sahifada QR keraksiz — kamera darhol
          ochiladi. Noutbukda esa aksincha: asosiy yoʻl QR, fayl
          tanlash ikkinchi darajali. */}
      {ticket ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Asosiy yoʻl — JONLI skaner: varaqni tutasiz, oʻzi
                oʻqiydi. Surat tortish ikkinchi darajali boʻlib qoldi
                (bitta varaqqa ~10 soniya vs ~1 soniya). */}
            {plan && (
              <Button size="lg" onClick={() => setLiveOpen(true)}>
                <ScanLine className="size-4" />
                Jonli skaner
              </Button>
            )}
            {plan && (
              <Button size="sm" variant="outline" onClick={() => setCardsOpen(true)}>
                <IdCard className="size-3.5" />
                QR-kartalar
              </Button>
            )}
            <Button
              size={plan ? "sm" : "lg"}
              variant={plan ? "outline" : "default"}
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
              {busy ? "Oʻqilmoqda..." : "Surat bilan"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {plan
              ? "Jonli skanerda varaqni kameraga tutib turing — oʻzi topadi va keyingisiga oʻtaverasiz."
              : "Bitta suratda 4 tagacha varaq boʻlishi mumkin."}
          </p>
        </div>
      ) : (
        <HandoffBlock
          setId={setId}
          classId={classId}
          onPickFile={() => fileRef.current?.click()}
          busy={busy}
        />
      )}

      {/* `capture="environment"` — telefonda orqa kamerani ochadi;
          kompyuterda oddiy fayl tanlash boʻlib qoladi. */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />

      {warnings.map((w) => (
        <Note key={w} tone="warn">
          {w}
        </Note>
      ))}

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {report && (
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3">
          <p className="text-sm">
            <Check className="mr-1.5 inline size-4" />
            {report.studentsAdded} oʻquvchi kiritildi · {report.answersSaved} javob yozildi.
          </p>
          {report.skipped.length > 0 && (
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              {report.skipped.map((s) => (
                <li key={s.name}>
                  {s.name} — {s.reason}
                </li>
              ))}
            </ul>
          )}
          {/* Baho JURNALDA EMAS — buni ochiq aytish shart. Koʻchirish
              hech qachon avtomatik emas (publish.ts qoidasi), shuning
              uchun oʻqituvchi qadamni bilib turishi kerak. */}
          <p className="text-sm text-muted-foreground">
            Javoblar sessiyaga yozildi, lekin jurnalda hali yoʻq.{" "}
            <Link href="/dashboard/assignments" className="underline underline-offset-2">
              Topshiriqlar
            </Link>{" "}
            boʻlimida shu testning sessiya panelini oching → sessiyani
            «Yopish» → jurnalga koʻchiring. Qolgan varaqlarni esa shu
            yerda kiritishda davom etishingiz mumkin.
          </p>
        </div>
      )}

      {sheets.map((sheet) => (
        <SheetCard
          key={sheet.key}
          sheet={sheet}
          roster={roster}
          onChange={(next) =>
            setSheets((prev) => prev.map((s) => (s.key === sheet.key ? next : s)))
          }
          onRemove={() => setSheets((prev) => prev.filter((s) => s.key !== sheet.key))}
        />
      ))}

      {sheets.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" disabled={saving || ready.length === 0} onClick={save}>
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            {saving ? "Kiritilmoqda..." : `Jurnalga kiritish (${ready.length})`}
          </Button>
          {ready.length < sheets.length && (
            <p className="text-xs text-muted-foreground">
              {sheets.length - ready.length} ta varaq kiritilmaydi — yuqoridagi
              sababga qarang.
            </p>
          )}
        </div>
      )}

      {cardsOpen && plan && (
        <CardScanner
          questionCount={plan.questionCount}
          nameByRef={new Map(plan.roster.map((r) => [r.no, r.name]))}
          onFinish={(capture) => {
            addCardSheets(capture);
            setCardsOpen(false);
          }}
          onClose={() => setCardsOpen(false)}
        />
      )}

      {liveOpen && plan && (
        <LiveScanner
          questionCount={plan.questionCount}
          expectedTestRef={plan.testRef}
          nameByRef={new Map(plan.roster.map((r) => [r.no, r.name]))}
          scannedRefs={scannedRefs}
          onScanned={addLiveSheet}
          onClose={() => setLiveOpen(false)}
        />
      )}
    </div>
  );
}

/* ── Noutbukdan telefonga oʻtish ──────────────────────────────────── */

/** «Havolani telefonga yuboring» oʻrniga — ekrandagi QR.

    Oʻqituvchi telefon kamerasini oʻz monitoriga tutadi va sahifa
    telefonda ochiladi. Bitta harakat: yuborish yoʻq, kirish yoʻq,
    ilova yoʻq. */
function HandoffBlock({
  setId,
  classId,
  onPickFile,
  busy,
}: {
  setId: string;
  classId: string;
  onPickFile: () => void;
  busy: boolean;
}) {
  const [handoff, setHandoff] = useState<ScanHandoff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function open() {
    setLoading(true);
    setError(null);
    try {
      setHandoff(await createScanHandoffAction({ setId, classId }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Havola tayyorlanmadi");
    } finally {
      setLoading(false);
    }
  }

  if (!handoff) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" disabled={loading} onClick={open}>
            {loading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Smartphone className="size-3.5" />
            )}
            Telefonda skanerlash
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={onPickFile}>
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
            {busy ? "Oʻqilmoqda..." : "Kompyuterdan rasm tanlash"}
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-4 sm:flex-row sm:items-center">
      {/* QR — serverda chizilgan SVG. Tashqi xizmatga rasm
          chizdirilmaydi: havolada chipta bor, u begona serverga
          bermaydigan qiymat. */}
      {/* QR IMKON QADAR KATTA.

          Eski yoki xira kamerali telefon mayda modulni ajrata olmaydi
          — bu eng koʻp uchraydigan nosozlik sababi. Shuning uchun
          kvadrat kichik ekranda ham 208 px, kengroq joyda 256 px va
          atrofida oq zaxira bor (aniqlagich chegarani koʻrishi
          kerak). */}
      <div
        className="size-52 shrink-0 self-center rounded-xl bg-white p-3 sm:size-64 [&>svg]:size-full"
        dangerouslySetInnerHTML={{ __html: handoff.qrSvg }}
      />
      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-sm font-medium">Telefon kamerangizni shu QR ga tuting</p>
        <p className="text-sm text-muted-foreground">
          Sahifa telefonda ochiladi — tizimga kirish shart emas. Varaqni suratga
          olasiz, natija shu testga tushadi. Havola 2 soat amal qiladi.
          Kamera oʻqiy olmasa — telefonni yaqinroq tuting yoki brauzerni
          kattalashtiring (Ctrl/⌘ va +).
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(handoff.url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <Check className="size-3.5" /> : null}
            {copied ? "Nusxalandi" : "Havolani nusxalash"}
          </Button>
          <Button size="sm" variant="ghost" disabled={busy} onClick={onPickFile}>
            Kompyuterdan rasm tanlash
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Bitta varaq ──────────────────────────────────────────────────── */

function SheetCard({
  sheet,
  roster,
  onChange,
  onRemove,
}: {
  sheet: PendingSheet;
  roster: ScanPreview["roster"];
  onChange: (next: PendingSheet) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState<number | null>(null);
  const student = roster.find((r) => r.id === sheet.studentId);
  const answered = sheet.answers.filter((a) => a.gradable && a.letter).length;
  const gradable = sheet.answers.filter((a) => a.gradable).length;

  function setLetter(no: number, letter: string | null) {
    onChange({
      ...sheet,
      answers: sheet.answers.map((a) =>
        // Qoʻlda tuzatilgan katak ishonchsiz emas — oʻqituvchi koʻrdi.
        a.no === no ? { ...a, letter, confidence: 1 } : a
      ),
    });
    setEditing(null);
  }

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border px-4 py-3 ${
        sheet.blocked || sheet.alreadyEntered
          ? "border-border bg-muted/30 opacity-70"
          : "border-border"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {/* Oʻquvchi — QR raqamidan topilgani, lekin OʻZGARTIRSA boʻladi.
            Qulflab qoʻyish notoʻgʻri: roʻyxat surilgan boʻlsa oʻqituvchi
            tuzatishning boshqa yoʻli qolmasdi. */}
        <select
          value={sheet.studentId ?? ""}
          disabled={sheet.blocked}
          onChange={(e) => onChange({ ...sheet, studentId: e.target.value || null })}
          className="h-8 min-w-44 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="">— oʻquvchini tanlang —</option>
          {roster.map((r) => (
            <option key={r.id} value={r.id}>
              {r.no}. {r.name}
            </option>
          ))}
        </select>

        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          {answered}/{gradable} javob
        </Badge>
        {sheet.alreadyEntered && (
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            allaqachon kiritilgan
          </Badge>
        )}
        <div className="flex-1" />
        <Button variant="ghost" size="icon" aria-label="Varaqni olib tashlash" onClick={onRemove}>
          <Trash2 className="size-4" />
        </Button>
      </div>

      {sheet.problems.map((p) => (
        <Note key={p} tone="warn">
          {p}
        </Note>
      ))}
      {!sheet.studentId && !sheet.blocked && sheet.problems.length === 0 && (
        <Note tone="warn">Oʻquvchi aniqlanmadi — roʻyxatdan tanlang.</Note>
      )}
      {student && sheet.alreadyEntered && (
        <Note>
          {student.name} shu test boʻyicha allaqachon kiritilgan. Ikkinchi marta
          yozilsa ball ikki barobar boʻlardi, shuning uchun bu varaq
          oʻtkazib yuboriladi.
        </Note>
      )}

      {/* Javoblar — bosilsa tuzatiladi. Past ishonchli katak ajratib
          koʻrsatiladi: dvigatel «shu yerda shubham bor» deydi, qaror
          oʻqituvchiniki. */}
      <div className="flex flex-wrap gap-1.5">
        {sheet.answers.map((a) =>
          editing === a.no ? (
            <div
              key={a.no}
              className="flex items-center gap-1 rounded-md border border-primary/50 bg-background px-1.5 py-1"
            >
              <span className="px-1 text-xs text-muted-foreground">{a.no}</span>
              {LETTERS.slice(0, Math.max(a.optionCount, 2)).map((l) => (
                <button
                  key={l}
                  type="button"
                  className="size-6 rounded border border-input text-xs hover:bg-accent"
                  onClick={() => setLetter(a.no, l)}
                >
                  {l}
                </button>
              ))}
              <button
                type="button"
                title="Boʻsh — javob berilmagan"
                className="size-6 rounded border border-input text-xs hover:bg-accent"
                onClick={() => setLetter(a.no, null)}
              >
                —
              </button>
            </div>
          ) : (
            <button
              key={a.no}
              type="button"
              disabled={!a.gradable || sheet.blocked}
              onClick={() => setEditing(a.no)}
              title={
                a.gradable
                  ? `${a.no}-savol — tuzatish uchun bosing`
                  : `${a.no}-savol variantli emas, baholanmaydi`
              }
              className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs disabled:opacity-50 ${
                !a.gradable
                  ? "border-dashed border-border text-muted-foreground"
                  : a.confidence < LOW_CONFIDENCE
                    ? "border-amber-500/60 bg-amber-500/10"
                    : "border-border hover:bg-accent"
              }`}
            >
              <span className="text-muted-foreground">{a.no}</span>
              <span className="font-medium">{a.letter ?? "—"}</span>
              {a.gradable && a.confidence < LOW_CONFIDENCE && (
                <TriangleAlert className="size-3 text-amber-600" />
              )}
            </button>
          )
        )}
      </div>
    </div>
  );
}

/* ── Yordamchilar ─────────────────────────────────────────────────── */

/** Suratni yuborishdan oldin kichraytirish.

    Ikki sabab:
      • Vercel serverless soʻrov tanasi ~4.5 MB, telefon surati esa
        bemalol 5-8 MB — kichraytirmasa soʻrov umuman yetib bormaydi.
      • Telefon tarmogʻida 8 MB yuklash uzoq; 2000 px kataklarni
        ajratishga yetarli.

    Kichraytirib boʻlmasa (eski brauzer, kutilmagan format) — asl fayl
    yuboriladi va hajmni server rad etadi. Jim tushib qolgandan koʻra
    ochiq xato yaxshi. */
async function downscale(file: File): Promise<Blob> {
  const MAX_EDGE = 2000;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= 3.5 * 1024 * 1024 && file.type === "image/jpeg") {
      return file;
    }
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85)
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

function Note({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${
        tone === "warn" ? "border-amber-500/40 bg-amber-500/5" : "border-border bg-muted/40"
      }`}
    >
      {tone === "warn" ? (
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
      ) : (
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      )}
      <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}
