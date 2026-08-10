"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  BadgeCheck, Check, ChevronLeft, ChevronRight, Globe, Library, Search, User, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SectionIcon } from "@/components/ui/section-icon";
import { Spinner } from "@/components/ui/spinner";
import { TypographyMuted } from "@/components/ui/typography";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle,
} from "@/components/ui/empty";
import { Illustration } from "@/components/ui/illustration";
import {
  assignBankTestAction, bankFacetsAction, listBankTestsAction,
} from "@/server/actions/test-bank";
import type {
  BankFacets, BankTest, BankTier,
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
}: {
  classId: string;
  className: string;
  onClose: () => void;
  /** Toʻplam yaratilgach sahifa roʻyxatini yangilaydi. */
  onAssigned: (setId: string) => void;
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

  async function handleAssign(test: BankTest) {
    setBusyId(test.id);
    try {
      const res = await assignBankTestAction({ testId: test.id, classId });
      if (res.ok) {
        // Kartochka darhol «Berilgan» holatiga oʻtadi — javobni kutib
        // qayta soʻramaymiz, aks holda tugma bir lahza yana bosiladigan
        // boʻlib qolardi va ikkinchi urinish dublikat xabarini berardi.
        setTests((prev) =>
          prev.map((x) => (x.id === test.id ? { ...x, alreadyInClass: true } : x))
        );
        onAssigned(res.setId);
        toast.success(t("assigned"), {
          description: t("assignedDescription", {
            title: res.title,
            count: res.questionCount,
            className,
          }),
        });
      } else if (res.reason === "duplicate") {
        setTests((prev) =>
          prev.map((x) => (x.id === test.id ? { ...x, alreadyInClass: true } : x))
        );
        toast.info(t("alreadyAssigned"));
      } else if (res.reason === "no_usable_questions") {
        toast.error(t("noUsableQuestions"));
      } else {
        toast.error(t("notFound"));
      }
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
          <SectionIcon>
            <Library />
          </SectionIcon>
          <div className="min-w-0">
            <h1 className="min-w-0 truncate text-lg font-semibold text-foreground">
              {t("title")}
            </h1>
            <TypographyMuted className="truncate text-xs">
              {t("subtitle", { className })}
            </TypographyMuted>
          </div>
        </div>
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
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTier(key)}
            aria-pressed={tier === key}
            className={
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors " +
              (tier === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground")
            }
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
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
          </Empty>
        ) : (
          <ScrollArea className="h-full w-full">
            <div className="grid grid-cols-1 gap-2.5 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {tests.map((test) => (
                <BankCard
                  key={test.id}
                  test={test}
                  busy={busyId === test.id}
                  onAssign={() => handleAssign(test)}
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
    </div>,
    document.body
  );
}

function BankCard({
  test, busy, onAssign,
}: {
  test: BankTest;
  busy: boolean;
  onAssign: () => void;
}) {
  const t = useTranslations("TestBank");
  const Icon = TIER_ICON[test.tier];

  return (
    <div className="list-card flex flex-col gap-2.5 p-3.5">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="line-clamp-2 text-sm font-medium text-foreground">
            {test.title}
          </h4>
          <TypographyMuted className="mt-0.5 truncate text-xs">
            {test.author ?? t("authorUnknown")}
          </TypographyMuted>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          {t("questionCount", { count: test.questionCount })}
        </Badge>
        {/* `null` = fansiz/sinfsiz — bu HAQIQIY holat, shuning uchun
            boʻsh qoldirilmay ochiq yoziladi. */}
        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          {test.subject ?? t("subjectNone")}
        </Badge>
        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          {test.grade ?? t("gradeNone")}
        </Badge>
      </div>

      <Button
        size="sm"
        variant={test.alreadyInClass ? "outline" : "default"}
        disabled={test.alreadyInClass || busy}
        onClick={onAssign}
        className="mt-auto w-full gap-1.5"
      >
        {busy ? (
          <Spinner className="size-3.5" />
        ) : test.alreadyInClass ? (
          <Check className="size-3.5" />
        ) : null}
        {test.alreadyInClass ? t("assignedBadge") : t("assign")}
      </Button>
    </div>
  );
}
