"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type Assignment,
} from "@/lib/grades-data";
import { useGradesStore } from "@/store/useGradesStore";
import { useMounted } from "@/lib/use-mounted";
import NewAssignmentModal, { type AssignmentFormValues } from "./NewAssignmentModal";
import GradesTable from "./GradesTable";
import ReuseModal from "./ReuseModal";
import NewTopicModal, { type TopicApplyPayload } from "./NewTopicModal";
import { Card } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { BookOpen } from "lucide-react";

type ModalType = "assignment" | "reuse" | "topic" | null;

/* ── Baholar jurnali — sinf boʻyicha parametrlangan umumiy koʻrinish.
   Standalone /grades sahifasi (ClassListPanel bilan) ham, sinf-detali
   GradesSection ham shu komponentni ishlatadi (DRY). `classId` propi qaysi
   sinf koʻrsatilishini belgilaydi; ichkarida toʻliq classDataMap saqlanadi,
   chunki mavzu/reuse amallari boshqa sinflarga ham ta'sir qiladi. ── */
export default function GradesView({ classId }: { classId: string }) {
  const mounted = useMounted();
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const updateClass = useGradesStore((s) => s.updateClass);
  const setClassDataMap = useGradesStore((s) => s.setClassDataMap);
  const [modal, setModal] = useState<ModalType>(null);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

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

  const classData = classDataMap[classId];

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
    toast.success(`${values.length} ta baho yopishtirildi`);
  }

  function handleReturnAll() {
    updateClass(classId, (cd) => ({
      ...cd,
      grades: cd.grades.map((g) => ({ ...g, isDraft: false })),
    }));
    toast.success("Qoralama baholar qaytarildi");
  }

  function handlePublishAssignment(assignmentId: string) {
    const title = classData?.assignments.find((a) => a.id === assignmentId)?.title;
    updateClass(classId, (cd) => ({
      ...cd,
      grades: cd.grades.map((g) =>
        g.assignmentId === assignmentId ? { ...g, isDraft: false } : g
      ),
    }));
    toast.success("Topshiriq nashr qilindi", { description: title });
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
    toast.success("Baholanmaganlarga qo‘llandi", { description: `${score} ball` });
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
    toast.success("Qolganlar “T” (topshirmadi) deb belgilandi");
  }

  function handleCreateAssignment(input: AssignmentFormValues) {
    updateClass(classId, (cd) => {
      const newAssignment: Assignment = {
        id: `a-${Date.now()}`,
        title: input.title,
        maxScore: input.maxScore,
        topicId: input.topicId,
        date: input.date,
      };
      return {
        ...cd,
        assignments: [...cd.assignments, newAssignment],
      };
    });
    setModal(null);
    toast.success("Topshiriq yaratildi", {
      description: input.title,
    });
  }

  function handleUpdateAssignment(input: AssignmentFormValues) {
    if (!editingAssignment) return;
    const id = editingAssignment.id;
    updateClass(classId, (cd) => ({
      ...cd,
      assignments: cd.assignments.map((a) =>
        a.id === id
          ? {
              ...a,
              title: input.title,
              maxScore: input.maxScore,
              topicId: input.topicId,
              date: input.date,
            }
          : a
      ),
    }));
    setEditingAssignment(null);
    toast.success("Topshiriq saqlandi", { description: input.title });
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
        title: `${sourceAssignment.title} (nusxa)`,
        topicId: targetTopic?.id ?? sourceAssignment.topicId,
      };
      return {
        ...cd,
        assignments: [...cd.assignments, newAssignment],
      };
    });
    setModal(null);
    toast.success("Topshiriq qayta ishlatildi", {
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
      inputMode: payload.inputMode,
      scaleKind: payload.scaleKind,
      weightPercent: payload.weightPercent,
      passLabel: payload.passLabel,
      failLabel: payload.failLabel,
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
    toast.success(payload.isEdit ? "Mavzu saqlandi" : "Mavzu yaratildi", {
      description: payload.name,
      ...(removedAny ? {
        action: {
          label: "Bekor qilish",
          onClick: () => {
            setClassDataMap(snapshot);
            toast.success("Tiklandi");
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
    toast.success("Mavzu oʻchirildi", {
      description: name || undefined,
      action: {
        label: "Bekor qilish",
        onClick: () => {
          setClassDataMap(snapshot);
          toast.success("Tiklandi", { description: name || undefined });
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

    toast.success("Topshiriq oʻchirildi", {
      description: removedAssignment.title,
      action: {
        label: "Bekor qilish",
        onClick: () => {
          updateClass(classId, (c) => ({
            ...c,
            assignments: [...c.assignments, removedAssignment],
            grades: [...c.grades, ...removedGrades],
          }));
          toast.success("Tiklandi", { description: removedAssignment.title });
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
          <Card className="flex flex-col items-center justify-center h-full gap-3">
            <Alert className="max-w-md bg-muted/50">
              <BookOpen className="size-4" />
              <AlertTitle>Bu sinfda oʻquvchilar yoʻq</AlertTitle>
              <AlertDescription>
                Baholarni kuzatish uchun oʻquvchi qoʻshing
              </AlertDescription>
            </Alert>
          </Card>
        ) : (
          <GradesTable
            classData={classData}
            onCellEdit={handleCellEdit}
            onReturnAll={handleReturnAll}
            onCreateAssignmentClick={() => setModal("assignment")}
            onReuseClick={() => setModal("reuse")}
            onTopicClick={() => setModal("topic")}
            onDeleteAssignment={handleDeleteAssignment}
            onPublishAssignment={handlePublishAssignment}
            onFillColumn={handleFillColumn}
            onMarkRemaining={handleMarkRemaining}
            onEditAssignment={(id) =>
              setEditingAssignment(classData.assignments.find((a) => a.id === id) ?? null)
            }
            onCellMark={handleCellMark}
            onPasteColumn={handlePasteColumn}
          />
        )}
      </section>

      {modal === "assignment" && classData && (
        <NewAssignmentModal
          topics={classData.topics}
          assignments={classData.assignments}
          onClose={() => setModal(null)}
          onSubmit={handleCreateAssignment}
        />
      )}
      {editingAssignment && classData && (
        <NewAssignmentModal
          mode="edit"
          topics={classData.topics}
          initial={{
            title: editingAssignment.title,
            maxScore: editingAssignment.maxScore,
            topicId: editingAssignment.topicId,
            date: editingAssignment.date ?? new Date().toISOString().slice(0, 10),
          }}
          onClose={() => setEditingAssignment(null)}
          onSubmit={handleUpdateAssignment}
        />
      )}
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
