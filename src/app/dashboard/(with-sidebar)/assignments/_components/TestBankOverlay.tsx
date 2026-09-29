"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  BadgeCheck, Check, ChevronLeft, ChevronRight, Globe, Link as LinkIcon,
  Plus, Presentation, Search, User, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BackButton } from "@/components/ui/back-button";
import { SegmentedToggle } from "@/components/ui/segmented-toggle";
import { Spinner } from "@/components/ui/spinner";
import { TypographyMuted } from "@/components/ui/typography";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle,
} from "@/components/ui/empty";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Illustration } from "@/components/ui/illustration";
import { useGradesStore } from "@/store/useGradesStore";
import {
  assignBankTestAction, bankFacetsAction, bankTestQuestionsAction,
  listBankTestsAction,
} from "@/server/actions/test-bank";
import type {
  BankFacets, BankPreview, BankTest, BankTier,
} from "@/lib/test-bank-types";

/* ════════════════════════════════════════════════════════════════════
   TEST BANKI — uchta daraja, bitta ekran

   Oʻqituvchi LessonLab test bazasini shu yerdan koʻradi va xohlaganini
   oʻz sinfiga beradi — botga umuman kirmasdan.

   ⛔ UCHTA DARAJA ARALASHMAYDI — bu butun boʻlimning maʼnosi:

     🌍 Ommaviy      boshqa ustozlar ulashgan testlar
     ✅ Tasdiqlangan LessonLab oʻzi tuzgan, ishonchli baza
     👤 Shaxsiy      oʻqituvchining oʻz bot testlari

   LessonLab'da baza testlari ommaviy roʻyxatga ham tushib ketardi va
   «tasdiqlangan» belgisi maʼnosini yoʻqotardi — roʻyxatga qarab qaysi
   biri ishonchli ekanini ayta olmasding. Ustozonaga oʻsha xato bilan
   koʻchirilmadi: ajratish SQL darajasida (`v_test_bank`).

   FILTRLAR NEGA MUHIM. LessonLab test tuzganda fan va sinfni ataylab
   soʻraydi — «fansiz» va «sinfsiz» ham HAQIQIY tanlov. Topshiriqlar
   koʻpaygach kerakli testni faqat shu ikki filtr topib beradi, shuning
   uchun «Fansiz»/«Sinfsiz» alohida band boʻlib turadi: ularsiz bunday
   testlarni umuman koʻrib boʻlmasdi.
   ════════════════════════════════════════════════════════════════════ */

/** Filtrdagi uch holat `Select` ning STRING qiymatlariga shunday tushadi:

      "__all__"  → filtr yoʻq          (DAL: null)
      "__none__" → «fansiz / sinfsiz»  (DAL: "", ya'ni SQL da IS NULL)
      boshqasi   → aniq qiymat

    Radix Select boʻsh satrni qiymat sifatida qabul QILMAYDI, shuning
    uchun sentinel kerak — `""` ni toʻgʻridan berish komponentni
    jimgina «tanlanmagan» holatiga tushirardi. */
const ALL = "__all__";
const NONE = "__none__";

function toFilter(value: string): string | null {
  if (value === ALL) return null;
  if (value === NONE) return "";
  return value;
}

const TIER_ICON: Record<BankTier, typeof Globe> = {
  ommaviy: Globe,
  tasdiqlangan: BadgeCheck,
  shaxsiy: User,
};

export default function TestBankOverlay({
  classId,
  className,
  onClose,
  onAssigned,
  onRun,
  onCreate,
}: {
  classId: string;
  className: string;
  onClose: () => void;
  /** Toʻplam yaratilgach sahifa roʻyxatini yangilaydi. */
  onAssigned: () => void;
  /** «Darsda oʻtkazish» — test shu sinfga qoʻshilgach oʻtkazish oynasi
      (Topshiriqlardagi bilan bir xil). Berilmasa tugma chiqmaydi. */
  onRun?: (setId: string, title: string) => void;
  /** Bank ichidan yangi test muharririni ochish. */
  onCreate?: () => void;
}) {
  const t = useTranslations("TestBank");

  const [tier, setTier] = useState<BankTier>("tasdiqlangan");
  const [subject, setSubject] = useState<string>(ALL);
  const [grade, setGrade] = useState<string>(ALL);
  const [search, setSearch] = useState("");
  /* Qidiruv MATNI va SOʻROV alohida holat: har harfda soʻrov yuborish
     yuzta testli bankda serverni koʻmib tashlardi. Soʻrov 350ms
     jimlikdan keyin yangilanadi. */
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);

  const [facets, setFacets] = useState<BankFacets>({ subjects: [], grades: [] });
  const [tests, setTests] = useState<BankTest[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(24);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  /* ── Sinf tanlash — bitta testni bir necha sinfga bir bosishda ────
     Ochilganda joriy sinf tanlangan boʻladi: eng koʻp uchraydigan
     holat aynan shu, va uni har safar qoʻlda belgilash ortiqcha
     bosish boʻlardi. Ustoz 8A/8B/8D ga bir xil dars bersa — uchtasini
     belgilaydi va bir marta bosadi (ilgari butun oqim 3 marta). */
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const allClasses = useMemo(
    () =>
      Object.values(classDataMap)
        .map((cd) => ({ id: cd.info.id, name: cd.info.name }))
        .sort((a, b) => a.name.localeCompare(b.name, "uz", { numeric: true })),
    [classDataMap]
  );
  const [targetClassIds, setTargetClassIds] = useState<string[]>([classId]);

  /* Ochiq sinf HAR DOIM tanlangan qoladi — oʻqituvchi aynan shu
     sinfning sahifasida turibdi va uni olib tashlash «qaysi sinfga
     berayapman?» degan savolni tugʻdirardi (mavjud topshiriq
     muharriridagi `classLockedHint` qoidasi bilan bir xil). */
  useEffect(() => { setTargetClassIds([classId]); }, [classId]);

  /** Savol koʻrish paneli — berishdan OLDIN. */
  const [preview, setPreview] = useState<BankPreview | null>(null);
  const [previewFor, setPreviewFor] = useState<BankTest | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(id);
  }, [search]);

  /* Daraja almashganda filtrlar TOZALANADI. «Tasdiqlangan» dagi fan
     roʻyxati «Ommaviy» dagidan boshqa — eski tanlov saqlansa yangi
     tabda hech narsa topilmasdi va bank buzuq koʻrinardi. */
  useEffect(() => {
    setSubject(ALL);
    setGrade(ALL);
    setPage(0);
    let alive = true;
    bankFacetsAction(tier)
      .then((f) => { if (alive) setFacets(f); })
      // Filtr — yordamchi maʼlumot. Kelmasa roʻyxat baribir ishlaydi,
      // xato koʻrsatib chalgʻitmaymiz.
      .catch(() => { if (alive) setFacets({ subjects: [], grades: [] }); });
    return () => { alive = false; };
  }, [tier]);

  useEffect(() => { setPage(0); }, [subject, grade, debouncedSearch]);

  /* ⚠️ Javoblar KELISH TARTIBI kafolatlanmagan: tez tab almashtirilsa
     eski soʻrov keyin kelib yangi roʻyxat ustiga yozilardi. Har
     soʻrovga navbat raqami beriladi va faqat OXIRGISI qabul qilinadi. */
  const reqRef = useRef(0);

  const load = useCallback(() => {
    const seq = ++reqRef.current;
    setLoading(true);
    setFailed(false);
    listBankTestsAction({
      classId,
      tier,
      subject: toFilter(subject),
      grade: toFilter(grade),
      search: debouncedSearch || null,
      page,
    })
      .then((res) => {
        if (seq !== reqRef.current) return;
        setTests(res.tests);
        setTotal(res.total);
        setPageSize(res.pageSize);
      })
      .catch(() => {
        if (seq !== reqRef.current) return;
        setTests([]);
        setTotal(0);
        setFailed(true);
      })
      .finally(() => {
        if (seq === reqRef.current) setLoading(false);
      });
  }, [classId, tier, subject, grade, debouncedSearch, page]);

  useEffect(load, [load]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  /** Savollarni koʻrish — kartochka bosilganda. */
  async function openPreview(test: BankTest) {
    setPreviewFor(test);
    setPreview(null);
    try {
      setPreview(await bankTestQuestionsAction(test.id));
    } catch {
      setPreview({ ok: false });
    }
  }

  /** «Sinfga qoʻshish» — test tanlangan sinf(lar)ning «Tayyor testlar»
      roʻyxatiga tushadi. `run` — «Darsda oʻtkazish»: qoʻshiladi va
      oʻtkazish oynasi JORIY sinf uchun darhol ochiladi.

      Ilgari bu yerda «Berish» va «Berish va boshlash» turardi. «Berish»
      oʻquvchilarga hech narsa bermasdi (faqat roʻyxatga qoʻshardi),
      «boshlash» esa qaysi turdagi ish ochilganini aytmasdi — ikkalasi
      ham nomi bilan chalgʻitardi. Endi usulni oʻqituvchi Topshiriqlardagi
      oynaning oʻzida tanlaydi (jonli dars, oʻyin, qogʻoz, pult...). */
  async function handleAssign(test: BankTest, run: boolean) {
    if (targetClassIds.length === 0) {
      toast.error(t("pickClassFirst"));
      return;
    }
    setBusyId(test.id);
    try {
      const res = await assignBankTestAction({ testId: test.id, classIds: targetClassIds });

      if (!res.ok) {
        toast.error(
          res.reason === "no_usable_questions" ? t("noUsableQuestions")
          : res.reason === "no_class" ? t("pickClassFirst")
          : t("notFound")
        );
        return;
      }

      // Joriy sinf roʻyxatga tushgan boʻlsa kartochka «Qoʻshilgan» ga
      // oʻtadi — javobni kutib qayta soʻramaymiz, aks holda tugma bir
      // lahza yana bosiladigan boʻlib qolardi.
      const touched = [...res.created, ...res.skipped];
      const here = touched.find((c) => c.classId === classId);
      if (here) {
        setTests((prev) =>
          prev.map((x) => (x.id === test.id ? { ...x, alreadyInClass: true } : x))
        );
      }
      onAssigned();

      // Allaqachon qoʻshilgan boʻlsa ham oʻtkazish mumkin — mavjud toʻplam bilan.
      if (run && here && onRun) {
        onRun(here.setId, res.title);
        return;
      }

      if (res.created.length === 0) {
        // Hammasi allaqachon qoʻshilgan — bu xato emas, shunchaki
        // aytiladi. Ilgari «duplicate» xato kabi koʻrinardi.
        toast.info(t("alreadyAssigned"));
        return;
      }

      toast.success(t("assigned"), {
        description: t("assignedDescription", {
          title: res.title,
          count: res.questionCount,
          classes: res.created.length,
          skipped: res.skipped.length,
        }),
        duration: 6000,
      });
    } catch {
      toast.error(t("assignFailed"));
    } finally {
      setBusyId(null);
    }
  }

  const tabs = useMemo(
    () =>
      (["ommaviy", "tasdiqlangan", "shaxsiy"] as BankTier[]).map((key) => ({
        key,
        label: t(`tier_${key}`),
        Icon: TIER_ICON[key],
      })),
    [t]
  );

  return createPortal(
    <div className="fixed inset-0 z-[46] flex flex-col bg-card animate-in fade-in-0 duration-fast">
      {/* Sarlavha */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <BackButton onClick={onClose} />
          <div className="min-w-0">
            <h1 className="min-w-0 truncate text-lg font-semibold text-foreground">
              {t("title")}
            </h1>
            <TypographyMuted className="truncate text-xs">
              {t("subtitle", { className })}
            </TypographyMuted>
          </div>
        </div>
        {onCreate && <Button variant="outline" size="sm" onClick={onCreate} className="shrink-0 gap-1.5">
          <Plus className="size-4" /> {t("createLocal")}
        </Button>}
        <button
          type="button"
          onClick={onClose}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
          <span className="sr-only">{t("close")}</span>
        </button>
      </div>

      {/* Darajalar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-5 py-3">
        <SegmentedToggle<BankTier>
          variant="pill"
          value={tier}
          onValueChange={setTier}
          options={tabs.map(({ key, label, Icon }) => ({
            value: key,
            label,
            icon: <Icon className="size-4" />,
          }))}
        />
      </div>

      {/* Filtrlar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-5 py-3">
        <div className="relative min-w-0 flex-1 basis-56">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-8"
          />
        </div>

        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-40 shrink-0">
            <SelectValue placeholder={t("subjectAll")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("subjectAll")}</SelectItem>
            <SelectItem value={NONE}>{t("subjectNone")}</SelectItem>
            {facets.subjects.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={grade} onValueChange={setGrade}>
          <SelectTrigger className="w-36 shrink-0">
            <SelectValue placeholder={t("gradeAll")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("gradeAll")}</SelectItem>
            <SelectItem value={NONE}>{t("gradeNone")}</SelectItem>
            {facets.grades.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <TypographyMuted className="ml-auto shrink-0 text-xs">
          {t("found", { count: total })}
        </TypographyMuted>
      </div>

      {/* Sinf tanlash — testni QAYSI sinflarga berish.
          Bitta sinf boʻlsa umuman koʻrsatilmaydi: tanlashga narsa yoʻq
          va qator faqat ekranni band qilardi. */}
      {allClasses.length > 1 && (
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border px-5 py-3">
          <TypographyMuted className="mr-1 shrink-0 text-xs font-medium">
            {t("targetClasses")}
          </TypographyMuted>
          {allClasses.map((c) => {
            const on = targetClassIds.includes(c.id);
            const locked = c.id === classId;
            return (
              <button
                key={c.id}
                type="button"
                disabled={locked}
                aria-pressed={on}
                title={locked ? t("classLocked") : undefined}
                onClick={() =>
                  setTargetClassIds((prev) =>
                    prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id]
                  )
                }
                className={
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
                  (on
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground") +
                  (locked ? " cursor-default opacity-90" : "")
                }
              >
                {on && <Check className="mr-1 inline size-3 align-[-1px]" />}
                {c.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Roʻyxat */}
      <div className="min-h-0 flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        ) : failed ? (
          <Empty className="h-full border-0">
            <EmptyHeader>
              <EmptyTitle>{t("loadFailedTitle")}</EmptyTitle>
              <EmptyDescription>{t("loadFailedDescription")}</EmptyDescription>
            </EmptyHeader>
            <Button variant="outline" onClick={load}>{t("retry")}</Button>
          </Empty>
        ) : tests.length === 0 ? (
          <Empty className="h-full border-0">
            <EmptyHeader>
              <EmptyMedia>
                <Illustration name="29" className="h-28 text-black dark:text-white" />
              </EmptyMedia>
              <EmptyTitle>
                {tier === "shaxsiy" ? t("emptyOwnTitle") : t("emptyTitle")}
              </EmptyTitle>
              <EmptyDescription>
                {tier === "shaxsiy" ? t("emptyOwnDescription") : t("emptyDescription")}
              </EmptyDescription>
            </EmptyHeader>
            {/* Bogʻlanmagan ustoz uchun CHIQISH YOʻLI. Ilgari matn
                «Telegram hisobingizni bogʻlang» deb turardi, lekin
                havola yoʻq edi — boshi berk koʻcha. */}
            {tier === "shaxsiy" && (
              <EmptyContent>
                <Button variant="outline" asChild>
                  <a href="/bogla">
                    <LinkIcon className="size-4" /> {t("linkTelegram")}
                  </a>
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : (
          <ScrollArea className="h-full w-full">
            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {tests.map((test) => (
                <BankCard
                  key={test.id}
                  test={test}
                  busy={busyId === test.id}
                  classCount={targetClassIds.length}
                  canRun={Boolean(onRun)}
                  onPreview={() => openPreview(test)}
                  onAssign={(run) => handleAssign(test, run)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Sahifalash — bitta sahifada boʻlsa umuman koʻrsatilmaydi */}
      {pageCount > 1 && (
        <div className="flex shrink-0 items-center justify-center gap-3 border-t border-border px-5 py-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <TypographyMuted className="text-xs">
            {t("pageOf", { page: page + 1, total: pageCount })}
          </TypographyMuted>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pageCount - 1 || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
      {/* Savol koʻrish — berishdan OLDIN. */}
      <Dialog open={!!previewFor} onOpenChange={(v) => { if (!v) setPreviewFor(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="pr-6 text-base">{previewFor?.title}</DialogTitle>
          </DialogHeader>

          {!preview ? (
            <div className="flex h-40 items-center justify-center">
              <Spinner className="size-5 text-muted-foreground" />
            </div>
          ) : !preview.ok ? (
            <TypographyMuted className="py-6 text-center text-sm">
              {t("previewFailed")}
            </TypographyMuted>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <ol className="flex flex-col gap-3 pr-3">
                {preview.questions.map((q, i) => (
                  <li key={i} className="rounded-lg border border-border p-3">
                    <p className="text-sm font-medium text-foreground">
                      {i + 1}. {q.stem}
                    </p>
                    <ul className="mt-1.5 flex flex-col gap-1">
                      {q.options.map((o) => (
                        <li
                          key={o.id}
                          className={
                            "flex items-start gap-1.5 text-xs " +
                            (o.isCorrect
                              ? "font-medium text-success"
                              : "text-muted-foreground")
                          }
                        >
                          {/* Toʻgʻri javob KOʻRSATILADI — ustoz test
                              sifatini aynan shundan baholaydi. */}
                          {o.isCorrect ? (
                            <Check className="mt-0.5 size-3 shrink-0" />
                          ) : (
                            <span className="mt-0.5 w-3 shrink-0" />
                          )}
                          <span>{o.text}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </ScrollArea>
          )}

          {/* Koʻrib turib darhol berish — oynani yopib kartani qayta
              qidirish qadami yoʻqoladi. */}
          {previewFor && (!previewFor.alreadyInClass || (onRun && targetClassIds.length <= 1)) && (
            <div className="flex flex-wrap justify-end gap-2 pt-1">
              {!previewFor.alreadyInClass && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyId === previewFor.id}
                  title={t("assignHint")}
                  onClick={() => { handleAssign(previewFor, false); setPreviewFor(null); }}
                >
                  {targetClassIds.length > 1
                    ? t("assignN", { count: targetClassIds.length })
                    : t("assign")}
                </Button>
              )}
              {onRun && targetClassIds.length <= 1 && (
                <Button
                  size="sm"
                  disabled={busyId === previewFor.id}
                  title={t("assignAndStartHint")}
                  onClick={() => { handleAssign(previewFor, true); setPreviewFor(null); }}
                >
                  <Presentation className="size-3.5" /> {t("assignAndStart")}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>,
    document.body
  );
}

function BankCard({
  test, busy, classCount, canRun, onPreview, onAssign,
}: {
  test: BankTest;
  busy: boolean;
  /** Nechta sinfga qoʻshiladi — tugma matnida koʻrsatiladi. */
  classCount: number;
  /** «Darsda oʻtkazish» tugmasi chiqadimi (bitta sinf tanlanganda). */
  canRun: boolean;
  onPreview: () => void;
  /** `run` — qoʻshib, darhol oʻtkazish oynasini ochish. */
  onAssign: (run: boolean) => void;
}) {
  const t = useTranslations("TestBank");
  const Icon = TIER_ICON[test.tier];

  return (
    <div className="list-card flex flex-col gap-3 p-3">
      {/* Sarlavha bosilsa savollar koʻrinadi — ustoz begona odam
          tuzgan testni koʻrmasdan sinfiga bermaydi. */}
      <button
        type="button"
        onClick={onPreview}
        className="flex items-start gap-3 text-left"
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-2 text-sm font-medium text-foreground group-hover:underline">
            {test.title}
          </h4>
          <TypographyMuted className="mt-0.5 truncate text-xs">
            {test.author ?? t("authorUnknown")}
          </TypographyMuted>
        </div>
      </button>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge size="sm" variant="outline" className="text-muted-foreground">
          {t("questionCount", { count: test.questionCount })}
        </Badge>
        {/* `null` = fansiz/sinfsiz — bu HAQIQIY holat, shuning uchun
            boʻsh qoldirilmay ochiq yoziladi. */}
        <Badge size="sm" variant="outline" className="text-muted-foreground">
          {test.subject ?? t("subjectNone")}
        </Badge>
        <Badge size="sm" variant="outline" className="text-muted-foreground">
          {test.grade ?? t("gradeNone")}
        </Badge>
      </div>

      {/* ⛔ «Qoʻshilgan» — faqat JORIY sinf uchun. Boshqa sinflar
          tanlangan boʻlsa tugma ochiq qolishi kerak, aks holda
          «8A da bor, 8B ga qoʻsha olmayman» holati chiqardi.
          Shuning uchun `classCount > 1` da bloklanmaydi — server
          allaqachon qoʻshilganini `skipped` ga qoʻyadi.
          «Darsda oʻtkazish» — faqat bitta (joriy) sinf tanlanganda:
          oʻtkazish oynasi bitta sinf uchun ochiladi. Koʻp sinfga esa
          faqat qoʻshiladi, har sinfda keyin alohida oʻtkaziladi. */}
      {(() => {
        const run = canRun && classCount <= 1;
        const added = test.alreadyInClass && classCount <= 1;
        return (
          <div className="mt-auto flex gap-1.5">
            {added ? (
              <Button size="sm" variant="outline" disabled className="flex-1 gap-1.5">
                <Check className="size-3.5" /> {t("assignedBadge")}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => onAssign(false)}
                className="flex-1"
                title={t("assignHint")}
              >
                {busy ? <Spinner className="size-3.5" /> : null}
                {classCount > 1 ? t("assignN", { count: classCount }) : t("assign")}
              </Button>
            )}
            {run && (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => onAssign(true)}
                className="flex-1 gap-1"
                title={t("assignAndStartHint")}
              >
                <Presentation className="size-3.5" />
                {t("assignAndStart")}
              </Button>
            )}
          </div>
        );
      })()}
    </div>
  );
}
