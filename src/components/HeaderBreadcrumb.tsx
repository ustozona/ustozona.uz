"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from "@/components/ui/command";
import { ClassSwatch } from "@/components/ClassSwatch";
import { ROUTE_LABEL_KEYS } from "@/lib/route-labels";
import { CLASS_SECTIONS } from "@/app/dashboard/classes/[id]/_components/sections";
import { useGradesStore } from "@/store/useGradesStore";
import { locateStudent } from "@/lib/student-profile";
import { classColor } from "@/lib/grades-data";
import { CLASS_COLOR_HEX } from "@/lib/class-colors";
import { subjectLabel } from "@/lib/standards-data";
import { useClassIdParamValue, setClassIdParam } from "@/hooks/useClassIdParam";
import { Check, ChevronsUpDown } from "lucide-react";

type Crumb =
  | { kind: "link" | "page"; href: string; label: string }
  | { kind: "class-switcher"; href: string; label: string; classId: string }
  | { kind: "stats-class-switcher"; href: string; label: string; classId: string }
  | { kind: "student-class-switcher"; href: string; label: string; classId: string }
  | { kind: "student-switcher"; href: string; label: string; studentId: string };

function humanize(segment: string) {
  return decodeURIComponent(segment)
    .replace(/-/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}

function useBreadcrumbs(): Crumb[] {
  const tRoutes = useTranslations("RouteLabels");
  const tSections = useTranslations("ClassSections");
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const classDataMap = useGradesStore((s) => s.classDataMap);
  // Statistika sahifasi ?classId=ni router.replace EMAS, xom
  // history.replaceState orqali yozadi (useClassIdParam) — useSearchParams()
  // buni sezmaydi, shuning uchun alohida jonli hook orqali oʻqiladi.
  const statsClassId = useClassIdParamValue(pathname);

  return React.useMemo(() => {
    const segments = pathname.split("/").filter(Boolean); // ["dashboard", ...]
    const crumbs: Crumb[] = [];
    let acc = "";

    for (let i = 0; i < segments.length; i++) {
      acc += `/${segments[i]}`;
      const prevSegment = segments[i - 1];

      if (prevSegment === "classes" && segments[i]) {
        const classId = decodeURIComponent(segments[i]);
        const name = classDataMap[classId]?.info?.name ?? classId;
        crumbs.push({ kind: "class-switcher", href: acc, label: name, classId });
        continue;
      }

      if (prevSegment === "students" && segments[i]) {
        const studentId = decodeURIComponent(segments[i]);
        const location = locateStudent(classDataMap, studentId);
        if (location) {
          crumbs.push({
            kind: "student-class-switcher",
            href: `/dashboard/students?classId=${location.classId}`,
            label: location.classInfo.name,
            classId: location.classId,
          });
        }
        const name = location?.roster[location.index]?.name ?? studentId;
        crumbs.push({ kind: "student-switcher", href: acc, label: name, studentId });
        continue;
      }

      const routeKey = ROUTE_LABEL_KEYS[acc];
      const label = routeKey ? tRoutes(routeKey) : humanize(segments[i]);
      crumbs.push({ kind: "link", href: acc, label });
    }

    // Sinf detali sahifasida ?b= bo'lim nomi qo'shimcha bo'g'in sifatida.
    const sectionKey = searchParams.get("b");
    if (segments[0] === "dashboard" && segments[1] === "classes" && sectionKey) {
      const section = CLASS_SECTIONS.find((s) => s.key === sectionKey);
      if (section && section.key !== "overview") {
        crumbs.push({ kind: "page", href: `${pathname}?b=${sectionKey}`, label: tSections(section.key) });
      }
    }

    // Statistika/O'quvchilar sahifasida ?classId= sinf tanlovi — yo'l bo'g'ini
    // emas, shuning uchun query-parametrdan alohida o'qiladi (sinf detali
    // sahifasidagi kabi qidiriladigan switcher sifatida).
    if ((pathname === "/dashboard/statistics" || pathname === "/dashboard/students") && statsClassId) {
      const name = classDataMap[statsClassId]?.info?.name ?? statsClassId;
      crumbs.push({ kind: "stats-class-switcher", href: `${pathname}?classId=${statsClassId}`, label: name, classId: statsClassId });
    }

    return crumbs;
  }, [pathname, searchParams, classDataMap, tSections, statsClassId]);
}

/* ── Umumiy: qidiruvli tanlovchi boʻgʻin (Popover+Command, StudentProfile
   switcheri bilan bir xil pattern) ── */
function SwitcherCrumb({
  label,
  isLast,
  placeholder,
  swatchHex,
  children,
}: {
  label: string;
  isLast: boolean;
  placeholder: string;
  /** Sinf rangi — kanonik ClassSwatch (rounded-full) label oldida. */
  swatchHex?: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const t = useTranslations("HeaderBreadcrumb");
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={
            "group flex min-w-0 items-center gap-1.5 transition-colors hover:text-foreground " +
            (isLast ? "text-foreground" : "")
          }
          aria-current={isLast ? "page" : undefined}
        >
          {swatchHex && <ClassSwatch hex={swatchHex} className="shrink-0" />}
          <span className="max-w-[10rem] truncate sm:max-w-[16rem]">{label}</span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>{t("notFound")}</CommandEmpty>
            {children(close)}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ClassSwitcherCrumb({
  label,
  classId,
  isLast,
}: {
  label: string;
  classId: string;
  isLast: boolean;
}) {
  const t = useTranslations("HeaderBreadcrumb");
  const router = useRouter();
  const searchParams = useSearchParams();
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const classes = React.useMemo(
    () => Object.values(classDataMap).map((cd) => cd.info).filter((c) => !c.archivedAt),
    [classDataMap]
  );
  const currentInfo = classDataMap[classId]?.info;
  const swatchHex = currentInfo ? CLASS_COLOR_HEX[classColor(currentInfo)] : undefined;

  const go = (id: string) => {
    const b = searchParams.get("b");
    const q = b ? `?b=${b}` : "";
    router.push(`/dashboard/classes/${encodeURIComponent(id)}${q}`);
  };

  return (
    <SwitcherCrumb label={label} isLast={isLast} placeholder={t("searchClassPlaceholder")} swatchHex={swatchHex}>
      {(close) => (
        <CommandGroup heading={t("myClassesHeading")}>
          {classes.map((c) => (
            <CommandItem
              key={c.id}
              value={`${c.name} ${subjectLabel(c.subject)}`}
              onSelect={() => { close(); if (c.id !== classId) go(c.id); }}
            >
              <ClassSwatch hex={CLASS_COLOR_HEX[classColor(c)]} />
              <span className="truncate">{c.name}</span>
              {c.subject && <span className="truncate text-muted-foreground">· {subjectLabel(c.subject)}</span>}
              {c.id === classId && <Check className="ml-auto size-4" />}
            </CommandItem>
          ))}
        </CommandGroup>
      )}
    </SwitcherCrumb>
  );
}

/** `ClassSwitcherCrumb`ning Statistika sahifasidagi hamkasbi — real sahifa
    navigatsiyasi (`router.push`) emas, `?classId=` yozadi (`setClassIdParam`,
    `useClassIdParam` yozuv yoʻli bilan bir xil manba). */
function StatsClassSwitcherCrumb({
  label,
  classId,
  isLast,
}: {
  label: string;
  classId: string;
  isLast: boolean;
}) {
  const t = useTranslations("HeaderBreadcrumb");
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const classes = React.useMemo(
    () => Object.values(classDataMap).map((cd) => cd.info).filter((c) => !c.archivedAt),
    [classDataMap]
  );
  const currentInfo = classDataMap[classId]?.info;
  const swatchHex = currentInfo ? CLASS_COLOR_HEX[classColor(currentInfo)] : undefined;

  return (
    <SwitcherCrumb label={label} isLast={isLast} placeholder={t("searchClassPlaceholder")} swatchHex={swatchHex}>
      {(close) => (
        <CommandGroup heading={t("myClassesHeading")}>
          {classes.map((c) => (
            <CommandItem
              key={c.id}
              value={`${c.name} ${subjectLabel(c.subject)}`}
              onSelect={() => { close(); if (c.id !== classId) setClassIdParam(c.id); }}
            >
              <ClassSwatch hex={CLASS_COLOR_HEX[classColor(c)]} />
              <span className="truncate">{c.name}</span>
              {c.subject && <span className="truncate text-muted-foreground">· {subjectLabel(c.subject)}</span>}
              {c.id === classId && <Check className="ml-auto size-4" />}
            </CommandItem>
          ))}
        </CommandGroup>
      )}
    </SwitcherCrumb>
  );
}

/** Oʻquvchi profilidagi sinf boʻgʻini — `ClassSwitcherCrumb`dan farqli,
    sinf detali sahifasiga emas, `/dashboard/students?classId=`ga oʻtadi
    (oʻquvchilar roʻyxati sinf boʻyicha filtrlanadi). */
function StudentClassSwitcherCrumb({
  label,
  classId,
  isLast,
}: {
  label: string;
  classId: string;
  isLast: boolean;
}) {
  const t = useTranslations("HeaderBreadcrumb");
  const router = useRouter();
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const classes = React.useMemo(
    () => Object.values(classDataMap).map((cd) => cd.info).filter((c) => !c.archivedAt),
    [classDataMap]
  );
  const currentInfo = classDataMap[classId]?.info;
  const swatchHex = currentInfo ? CLASS_COLOR_HEX[classColor(currentInfo)] : undefined;

  return (
    <SwitcherCrumb label={label} isLast={isLast} placeholder={t("searchClassPlaceholder")} swatchHex={swatchHex}>
      {(close) => (
        <CommandGroup heading={t("myClassesHeading")}>
          {classes.map((c) => (
            <CommandItem
              key={c.id}
              value={`${c.name} ${subjectLabel(c.subject)}`}
              onSelect={() => {
                close();
                router.push(`/dashboard/students?classId=${encodeURIComponent(c.id)}`);
              }}
            >
              <ClassSwatch hex={CLASS_COLOR_HEX[classColor(c)]} />
              <span className="truncate">{c.name}</span>
              {c.subject && <span className="truncate text-muted-foreground">· {subjectLabel(c.subject)}</span>}
              {c.id === classId && <Check className="ml-auto size-4" />}
            </CommandItem>
          ))}
        </CommandGroup>
      )}
    </SwitcherCrumb>
  );
}

function StudentSwitcherCrumb({
  label,
  studentId,
  isLast,
}: {
  label: string;
  studentId: string;
  isLast: boolean;
}) {
  const t = useTranslations("HeaderBreadcrumb");
  const router = useRouter();
  const searchParams = useSearchParams();
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const location = React.useMemo(
    () => locateStudent(classDataMap, studentId),
    [classDataMap, studentId]
  );

  const go = (id: string) => {
    const tab = searchParams.get("tab");
    const q = tab ? `?tab=${tab}` : "";
    router.push(`/dashboard/students/${encodeURIComponent(id)}${q}`);
  };

  if (!location) {
    return <BreadcrumbPage className="max-w-[10rem] truncate sm:max-w-[16rem]">{label}</BreadcrumbPage>;
  }

  return (
    <SwitcherCrumb label={label} isLast={isLast} placeholder={t("searchStudentPlaceholder")}>
      {(close) => (
        <CommandGroup heading={location.classInfo.name}>
          {location.roster.map((r) => (
            <CommandItem
              key={r.id}
              value={r.name}
              onSelect={() => { close(); if (r.id !== studentId) go(r.id); }}
            >
              <div
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                style={{ backgroundColor: location.hex }}
              >
                {r.initials}
              </div>
              <span className="truncate">{r.name}</span>
              {r.id === studentId && <Check className="ml-auto size-4" />}
            </CommandItem>
          ))}
        </CommandGroup>
      )}
    </SwitcherCrumb>
  );
}

export default function HeaderBreadcrumb() {
  // useSearchParams() prerender'da Suspense chegarasini talab qiladi —
  // aks holda dashboard'dagi HAR BIR sahifaning build'i yiqiladi.
  return (
    <React.Suspense fallback={null}>
      <HeaderBreadcrumbInner />
    </React.Suspense>
  );
}

function HeaderBreadcrumbInner() {
  const crumbs = useBreadcrumbs();

  if (crumbs.length === 0) return null;

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          // Mobil/kichik ekranda faqat oxirgi 1-2 bo'g'in ko'rinsin.
          const hiddenOnMobile = crumbs.length > 2 && i < crumbs.length - 2;
          return (
            <React.Fragment key={crumb.href}>
              {i > 0 && <BreadcrumbSeparator className={hiddenOnMobile ? "hidden sm:flex" : undefined} />}
              <BreadcrumbItem className={cnHidden(hiddenOnMobile, isLast)}>
                {crumb.kind === "class-switcher" ? (
                  <ClassSwitcherCrumb label={crumb.label} classId={crumb.classId} isLast={isLast} />
                ) : crumb.kind === "stats-class-switcher" ? (
                  <StatsClassSwitcherCrumb label={crumb.label} classId={crumb.classId} isLast={isLast} />
                ) : crumb.kind === "student-class-switcher" ? (
                  <StudentClassSwitcherCrumb label={crumb.label} classId={crumb.classId} isLast={isLast} />
                ) : crumb.kind === "student-switcher" ? (
                  <StudentSwitcherCrumb label={crumb.label} studentId={crumb.studentId} isLast={isLast} />
                ) : isLast ? (
                  <BreadcrumbPage className="max-w-[10rem] truncate sm:max-w-[16rem]">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className="max-w-[8rem] truncate sm:max-w-[12rem]">
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function cnHidden(hiddenOnMobile: boolean, isLast: boolean) {
  if (isLast) return "min-w-0";
  return hiddenOnMobile ? "hidden sm:inline-flex" : undefined;
}
