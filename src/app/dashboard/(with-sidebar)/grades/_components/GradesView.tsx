"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  type Assignment,
  type ClassData,
} from "@/lib/grades-data";
import { useGradesStore } from "@/store/useGradesStore";
import { useCalendarStore } from "@/store/useCalendarStore";
import { inRange } from "@/lib/academic-calendar";
import { todayKey } from "@/lib/date-keys";
import { useMounted } from "@/lib/use-mounted";
import GradesTable from "./GradesTable";
import ReuseModal from "./ReuseModal";
import NewTopicModal, { type TopicApplyPayload } from "./NewTopicModal";
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { BookOpen } from "lucide-react";
import {
  useAssignmentEditorStore, makeDraftPayload,
} from "@/store/useAssignmentEditorStore";

type ModalType = "reuse" | "topic" | null;

/* ── Baholar jurnali — sinf boʻyicha parametrlangan umumiy koʻrinish.
   Standalone /grades sahifasi (ClassListPanel bilan) ham, sinf-detali
   GradesSection ham shu komponentni ishlatadi (DRY). `classId` propi qaysi
   sinf koʻrsatilishini belgilaydi; ichkarida toʻliq classDataMap saqlanadi,
   chunki mavzu/reuse amallari boshqa sinflarga ham ta'sir qiladi. ── */
export default function GradesView({
  classId,
  demoClassData,
}: {
  classId: string;
  /** Tur demo rejimida haqiqiy classData oʻrniga koʻrsatiladigan namunaviy jurnal. */
  demoClassData?: ClassData;
}) {
  const t = useTranslations("GradesView");
  const mounted = useMounted();
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const updateClass = useGradesStore((s) => s.updateClass);
  const setClassDataMap = useGradesStore((s) => s.setClassDataMap);
  // Faol oʻquv yili oynasi — jurnal ustunlari shu oraliqqa filtrlanadi.
  const yearRange = useCalendarStore((s) => s.calendar.range);
  const [modal, setModal] = useState<ModalType>(null);
  // Topshiriq muharriri endi GLOBAL (AssignmentEditorHost) — bu sahifa faqat
  // sessiyani ochadi, oʻzi chizmaydi. Shu sabab boshqa boʻlimga oʻtilsa ham
  // qoralama yoʻqolmaydi.
  const openDraft = useAssignmentEditorStore((s) => s.openDraft);
  const openEdit = useAssignmentEditorStore((s) => s.openEdit);

  // Sozlamalardagi "Jurnal boʻlimida boshqarish" havolasi: ?topics=1 →
  // toifalar modalini ochib, paramni URL'dan tozalaymiz (router.replace
  // remount qilgani uchun history.replaceState — bell patterni).
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("topics") !== "1") return;
    setModal("topic");
    sp.delete("topics");
    const qs = sp.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? `?${qs}` : ""));
  }, []);

  const classData = demoClassData ?? classDataMap[classId];

  // Koʻp oʻquv yili 3-bosqich: koʻrsatiladigan topshiriqlarni FAOL yil oynasiga
  // filtrlaymiz. Bu FAQAT koʻrinish qatlami — store toʻliq qoladi, shuning uchun
  // barcha mutatorlar (yaratish/tahrir/oʻchirish/reuse/mavzu) toʻliq jurnalga
  // ishlaydi (ular quyida `classData`/store'ga tayanadi, `viewData`ga emas).
  // Sanasi yil oraligʻida boʻlmagan topshiriq va uning baholari koʻrinmaydi;
  // sanasi yoʻq topshiriq (backfill'dan keyin boʻlmasligi kerak) hamma yilda
  // koʻrinadi. Demo/tur namunasi hamda kalendar sozlanmagan holat filtrsiz.
  const viewData = useMemo(() => {
    if (!classData || demoClassData) return classData;
    const { start, end } = yearRange;
    if (!start || !end) return classData;
    const visible = classData.assignments.filter(
      (a) => !a.date || (a.date >= start && a.date <= end)
    );
    if (visible.length === classData.assignments.length) return classData;
    const visibleIds = new Set(visible.map((a) => a.id));
    return {
      ...classData,
      assignments: visible,
      grades: classData.grades.filter((g) => visibleIds.has(g.assignmentId)),
    };
  }, [classData, demoClassData, yearRange]);

  // Bugun faol yildan tashqarida boʻlsa (arxiv/kelgusi yil koʻrilmoqda) — yangi
  // topshiriq yaratishni yumshoq bloklaymiz: default sana bugun boʻlgani uchun u
  // koʻrilayotgan yil oynasiga tushmaydi va darrov yoʻqolib qolardi. Mavjud
  // yozuvlarni tahrirlash (arxivning asl amali) baribir ishlayveradi. Demo/tur
  // namunasi va sozlanmagan kalendarda blok yoʻq.
  const archiveNotice =
    !demoClassData && yearRange.start && yearRange.end && !inRange(todayKey(), yearRange)
      ? t("archiveNotice")
      : null;

  /* Jurnaldan yaratish — mazmun ixtiyoriy (`manualCreate`), natija baho ustuni.
     Manba HAQIQIY store: tur/demo namunasida sinf yoʻq, muharrir ochilmaydi. */
  function handleCreateAssignment() {
    const real = classDataMap[classId];
    if (!real) return;
    openDraft(classId, true, makeDraftPayload(classId, real.topics[0]?.id ?? null));
  }

  function handleCellEdit(
    studentId: string,
    assignmentId: string,
    score: number | null
  ) {
    updateClass(classId, (cd) => {
      const idx = cd.grades.findIndex(
        (g) => g.studentId === studentId && g.assignmentId === assignmentId
      );
      const nextGrades = [...cd.grades];
      if (idx === -1) {
        nextGrades.push({
          studentId,
          assignmentId,
          score,
          isDraft: score !== null,
        });
      } else {
        nextGrades[idx] = {
          ...nextGrades[idx],
          score,
          isDraft: score !== null,
          isMissing: false,
          missing: undefined,
        };
      }
      return { ...cd, grades: nextGrades };
    });
  }

  // Bitta katakni Q (qatnashmadi) / T (topshirmadi) deb belgilash yoki tozalash.
  function handleCellMark(
    studentId: string,
    assignmentId: string,
    mark: "absent" | "unsubmitted" | null
  ) {
    updateClass(classId, (cd) => {
      const idx = cd.grades.findIndex(
        (g) => g.studentId === studentId && g.assignmentId === assignmentId
      );
      const nextGrades = [...cd.grades];
      const patch = { score: null, missing: mark ?? undefined, isMissing: false, isDraft: false };
      if (idx === -1) {
        nextGrades.push({ studentId, assignmentId, ...patch });
      } else {
        nextGrades[idx] = { ...nextGrades[idx], ...patch };
      }
      return { ...cd, grades: nextGrades };
    });
  }

  // Ustunga ketma-ket (vertikal) yopishtirish: startStudentId'dan pastga.
  function handlePasteColumn(
    startStudentId: string,
    assignmentId: string,
    orderedStudentIds: string[],
    values: number[]
  ) {
    if (values.length === 0) return;
    const start = orderedStudentIds.indexOf(startStudentId);
    if (start === -1) return;
    updateClass(classId, (cd) => {
      const nextGrades = [...cd.grades];
      values.forEach((v, k) => {
        const sid = orderedStudentIds[start + k];
        if (!sid) return;
        const idx = nextGrades.findIndex(
          (g) => g.studentId === sid && g.assignmentId === assignmentId
        );
        const patch = { score: v, isDraft: true, isMissing: false, missing: undefined };
        if (idx === -1) nextGrades.push({ studentId: sid, assignmentId, ...patch });
        else nextGrades[idx] = { ...nextGrades[idx], ...patch };
      });
      return { ...cd, grades: nextGrades };
    });
    toast.success(t("gradesPasted", { count: values.length }));
  }

  function handleReturnAll() {
    updateClass(classId, (cd) => ({
      ...cd,
      grades: cd.grades.map((g) => ({ ...g, isDraft: false })),
    }));
    toast.success(t("draftsReturned"));
  }

  function handlePublishAssignment(assignmentId: string) {
    const title = classData?.assignments.find((a) => a.id === assignmentId)?.title;
    updateClass(classId, (cd) => ({
      ...cd,
      grades: cd.grades.map((g) =>
        g.assignmentId === assignmentId ? { ...g, isDraft: false } : g
      ),
    }));
    toast.success(t("assignmentPublished"), { description: title });
  }

  // Baholanmagan (ball ham, Q/T ham yo‘q) o‘quvchilarga ommaviy qo‘llash.
  function handleFillColumn(assignmentId: string, score: number) {
    updateClass(classId, (cd) => {
      const graded = new Set(
        cd.grades
          .filter((g) => g.assignmentId === assignmentId && (g.score !== null || g.missing))
          .map((g) => g.studentId)
      );
      const additions = cd.students
        .filter((s) => !graded.has(s.id))
        .map((s) => ({ studentId: s.id, assignmentId, score, isDraft: true }));
      // Mavjud bo‘sh (score=null, missing yo‘q) yozuvlarni ham yangilaymiz.
      const nextGrades = cd.grades.map((g) =>
        g.assignmentId === assignmentId && g.score === null && !g.missing
          ? { ...g, score, isDraft: true }
          : g
      );
      return { ...cd, grades: [...nextGrades, ...additions] };
    });
    toast.success(t("appliedToUngraded"), { description: t("scoreLabel", { score }) });
  }

  function handleMarkRemaining(assignmentId: string) {
    updateClass(classId, (cd) => {
      const graded = new Set(
        cd.grades
          .filter((g) => g.assignmentId === assignmentId && (g.score !== null || g.missing))
          .map((g) => g.studentId)
      );
      const additions = cd.students
        .filter((s) => !graded.has(s.id))
        .map((s) => ({ studentId: s.id, assignmentId, score: null, missing: "unsubmitted" as const }));
      const nextGrades = cd.grades.map((g) =>
        g.assignmentId === assignmentId && g.score === null && !g.missing
          ? { ...g, missing: "unsubmitted" as const }
          : g
      );
      return { ...cd, grades: [...nextGrades, ...additions] };
    });
    toast.success(t("remainingMarkedUnsubmitted"));
  }

  function handleReuse(_sourceClassId: string, sourceAssignment: Assignment) {
    updateClass(classId, (cd) => {
      // Mavjud topicʼlardan eng moslini topamiz, boʻlmasa birinchisini
      const targetTopic =
        cd.topics.find((t) => t.id === sourceAssignment.topicId) ??
        cd.topics[0];
      const newAssignment: Assignment = {
        ...sourceAssignment,
        id: `a-${Date.now()}`,
        title: t("copySuffix", { title: sourceAssignment.title }),
        topicId: targetTopic?.id ?? sourceAssignment.topicId,
      };
      return {
        ...cd,
        assignments: [...cd.assignments, newAssignment],
      };
    });
    setModal(null);
    toast.success(t("assignmentReused"), {
      description: sourceAssignment.title,
    });
  }

  // Mavzu guruhini tanlangan sinflar toʻplamiga moslaymiz (yaratish + tahrirlash):
  // belgilangan sinfga yoʻq boʻlsa nusxa qoʻshiladi, bor boʻlsa maydonlari
  // yangilanadi; belgilanmagan sinfdan (tahrirda) olib tashlanadi.
  function handleApplyTopic(payload: TopicApplyPayload) {
    const wanted = new Set(payload.classIds);
    const fields = {
      groupId: payload.groupId,
      name: payload.name,
      color: payload.color,
      purpose: payload.purpose,
      scaleKind: payload.scaleKind,
      weightPercent: payload.weightPercent,
    };
    // Bekor qilish uchun joriy holatni saqlaymiz (tahrir baho/topshiriqni oʻchirishi mumkin).
    const snapshot = classDataMap;
    let removedAny = false;
    setClassDataMap((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        const cd = next[id];
        const existing = cd.topics.find((t) => (t.groupId ?? t.id) === payload.groupId);
        if (wanted.has(id)) {
          if (existing) {
            next[id] = {
              ...cd,
              topics: cd.topics.map((t) => (t === existing ? { ...t, ...fields } : t)),
            };
          } else {
            next[id] = {
              ...cd,
              topics: [...cd.topics, { id: `${payload.groupId}-${id}`, ...fields }],
            };
          }
        } else if (existing) {
          // Sinf tanlovdan olib tashlandi — mavzu va unga bogʻliq topshiriq/baholar oʻchadi.
          removedAny = true;
          const droppedIds = new Set(
            cd.assignments.filter((a) => a.topicId === existing.id).map((a) => a.id)
          );
          next[id] = {
            ...cd,
            topics: cd.topics.filter((t) => t !== existing),
            assignments: cd.assignments.filter((a) => a.topicId !== existing.id),
            grades: cd.grades.filter((g) => !droppedIds.has(g.assignmentId)),
          };
        }
      }
      return next;
    });
    // Tahrir baho/topshiriqni oʻchirgan boʻlsa — bekor qilish taklif qilamiz.
    toast.success(payload.isEdit ? t("topicSaved") : t("topicCreated"), {
      description: payload.name,
      ...(removedAny ? {
        action: {
          label: t("undo"),
          onClick: () => {
            setClassDataMap(snapshot);
            toast.success(t("restored"));
          },
        },
      } : {}),
    });
  }

  function handleDeleteTopicGroup(groupId: string) {
    const snapshot = classDataMap;
    let name = "";
    setClassDataMap((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        const cd = next[id];
        const existing = cd.topics.find((t) => (t.groupId ?? t.id) === groupId);
        if (!existing) continue;
        name = existing.name;
        const droppedIds = new Set(
          cd.assignments.filter((a) => a.topicId === existing.id).map((a) => a.id)
        );
        next[id] = {
          ...cd,
          topics: cd.topics.filter((t) => t !== existing),
          assignments: cd.assignments.filter((a) => a.topicId !== existing.id),
          grades: cd.grades.filter((g) => !droppedIds.has(g.assignmentId)),
        };
      }
      return next;
    });
    toast.success(t("topicDeleted"), {
      description: name || undefined,
      action: {
        label: t("undo"),
        onClick: () => {
          setClassDataMap(snapshot);
          toast.success(t("restored"), { description: name || undefined });
        },
      },
    });
  }

  function handleDeleteAssignment(assignmentId: string) {
    const cd = classDataMap[classId];
    const removedAssignment = cd?.assignments.find((a) => a.id === assignmentId);
    if (!removedAssignment) return;
    // Bekor qilish uchun o‘chirilayotgan topshiriq va uning baholarini saqlaymiz.
    const removedGrades = cd.grades.filter((g) => g.assignmentId === assignmentId);

    updateClass(classId, (c) => ({
      ...c,
      assignments: c.assignments.filter((a) => a.id !== assignmentId),
      grades: c.grades.filter((g) => g.assignmentId !== assignmentId),
    }));

    toast.success(t("assignmentDeleted"), {
      description: removedAssignment.title,
      action: {
        label: t("undo"),
        onClick: () => {
          updateClass(classId, (c) => ({
            ...c,
            assignments: [...c.assignments, removedAssignment],
            grades: [...c.grades, ...removedGrades],
          }));
          toast.success(t("restored"), { description: removedAssignment.title });
        },
      },
    });
  }

  // Persist store tiklanmaguncha SSR seed bilan mos placeholder.
  if (!mounted) return <div className="flex-1 min-w-0 min-h-0" />;

  return (
    <div className="flex-1 min-w-0 min-h-0 flex flex-col">
      <section className="flex-1 min-w-0 min-h-0 flex flex-col" data-tour="grades-grid">
        {!classData ? (
          <Card className="flex flex-col items-center justify-center h-full gap-3 shadow-none">
            <Alert className="max-w-md bg-muted/50">
              <BookOpen className="size-4" />
              <AlertTitle>{t("noStudentsTitle")}</AlertTitle>
              <AlertDescription>
                {t("noStudentsDescription")}
              </AlertDescription>
            </Alert>
          </Card>
        ) : (
          <GradesTable
            classData={viewData ?? classData}
            onCellEdit={handleCellEdit}
            onReturnAll={handleReturnAll}
            onCreateAssignmentClick={handleCreateAssignment}
            onReuseClick={() => setModal("reuse")}
            onTopicClick={() => setModal("topic")}
            onDeleteAssignment={handleDeleteAssignment}
            onPublishAssignment={handlePublishAssignment}
            onFillColumn={handleFillColumn}
            onMarkRemaining={handleMarkRemaining}
            onEditAssignment={(id) => openEdit(classId, id)}
            onCellMark={handleCellMark}
            onPasteColumn={handlePasteColumn}
            archiveNotice={archiveNotice}
          />
        )}
      </section>

      {modal === "reuse" && (
        <ReuseModal
          classDataMap={classDataMap}
          currentClassId={classId}
          onClose={() => setModal(null)}
          onReuse={handleReuse}
        />
      )}
      {modal === "topic" && (
        <NewTopicModal
          classDataMap={classDataMap}
          currentClassId={classId}
          onClose={() => setModal(null)}
          onApply={handleApplyTopic}
          onDeleteGroup={handleDeleteTopicGroup}
        />
      )}
    </div>
  );
}
