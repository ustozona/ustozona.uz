"use client";

import { useMemo, useState } from "react";
import {
  CLASS_DATA,
  type Assignment,
  type AssignmentWeight,
  type ClassData,
  type Topic,
} from "@/lib/grades-data";
import { calcStudentTotals } from "./_components/helpers";
import ClassListPanel from "@/components/ClassListPanel";
import GradesTable from "./_components/GradesTable";
import NewAssignmentModal from "./_components/NewAssignmentModal";
import ReuseModal from "./_components/ReuseModal";
import NewTopicModal from "./_components/NewTopicModal";

type ModalType = "assignment" | "reuse" | "topic" | null;

export default function GradesPage() {
  const [classDataMap, setClassDataMap] = useState<Record<string, ClassData>>(
    () => structuredClone(CLASS_DATA)
  );
  const [selectedClassId, setSelectedClassId] = useState<string>(
    () => Object.keys(CLASS_DATA)[0] ?? "9-b"
  );
  const [modal, setModal] = useState<ModalType>(null);

  const classData = classDataMap[selectedClassId];

  const classAverage = useMemo(() => {
    if (!classData) return 0;
    const totals = calcStudentTotals(classData.students, classData.grades);
    return (
      totals.reduce((sum, t) => sum + t.percent, 0) /
      Math.max(totals.length, 1)
    );
  }, [classData]);

  function updateClass(id: string, updater: (cd: ClassData) => ClassData) {
    setClassDataMap((prev) => {
      const cd = prev[id];
      if (!cd) return prev;
      return { ...prev, [id]: updater(cd) };
    });
  }

  function handleCellEdit(
    studentId: string,
    assignmentId: string,
    score: number | null
  ) {
    updateClass(selectedClassId, (cd) => {
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
        };
      }
      return { ...cd, grades: nextGrades };
    });
  }

  function handleReturnAll() {
    updateClass(selectedClassId, (cd) => ({
      ...cd,
      grades: cd.grades.map((g) => ({ ...g, isDraft: false })),
    }));
  }

  function handleCreateAssignment(input: {
    title: string;
    maxScore: number;
    weight: AssignmentWeight;
    topicId: string;
  }) {
    updateClass(selectedClassId, (cd) => {
      const newAssignment: Assignment = {
        id: `a-${Date.now()}`,
        title: input.title,
        maxScore: input.maxScore,
        topicId: input.topicId,
        weight: input.weight,
      };
      return {
        ...cd,
        assignments: [...cd.assignments, newAssignment],
      };
    });
    setModal(null);
  }

  function handleReuse(_sourceClassId: string, sourceAssignment: Assignment) {
    updateClass(selectedClassId, (cd) => {
      // Mavjud topic'lardan eng moslini topamiz, bo'lmasa birinchisini
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
  }

  function handleCreateTopic(targetClassId: string, topic: Topic) {
    updateClass(targetClassId, (cd) => ({
      ...cd,
      topics: [...cd.topics, topic],
    }));
    setModal(null);
  }

  function handleDeleteAssignment(assignmentId: string) {
    updateClass(selectedClassId, (cd) => ({
      ...cd,
      assignments: cd.assignments.filter((a) => a.id !== assignmentId),
      grades: cd.grades.filter((g) => g.assignmentId !== assignmentId),
    }));
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-3.8rem)] gap-4 p-4 overflow-hidden">
      <div
        className="flex-1 min-h-0 grid p-3 -m-3"
        style={{
          gridTemplateColumns: "calc(25% + 0.25rem) calc(75% - 0.25rem)",
          gridTemplateRows: "1fr",
          transition: "grid-template-columns 350ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
      <ClassListPanel
        selectedClassId={selectedClassId}
        onSelect={setSelectedClassId}
        classDataMap={classDataMap}
        classAverage={classAverage}
      />

      <section className="min-w-0 min-h-0 grid" data-tour="grades-grid">
        {!classData ? (
          <div className="flex flex-col items-center justify-center h-full bg-card border border-border rounded-xl gap-3">
            <p className="text-base font-semibold text-foreground">Bu sinfda o&apos;quvchilar yo&apos;q</p>
            <p className="text-sm text-muted-foreground">Baholarni kuzatish uchun o&apos;quvchi qo&apos;shing</p>
          </div>
        ) : (
          <GradesTable
            classData={classData}
            onCellEdit={handleCellEdit}
            onReturnAll={handleReturnAll}
            onCreateAssignmentClick={() => setModal("assignment")}
            onReuseClick={() => setModal("reuse")}
            onTopicClick={() => setModal("topic")}
            onDeleteAssignment={handleDeleteAssignment}
          />
        )}
      </section>
      </div>

      {modal === "assignment" && classData && (
        <NewAssignmentModal
          topics={classData.topics}
          onClose={() => setModal(null)}
          onCreate={handleCreateAssignment}
        />
      )}
      {modal === "reuse" && (
        <ReuseModal
          classDataMap={classDataMap}
          currentClassId={selectedClassId}
          onClose={() => setModal(null)}
          onReuse={handleReuse}
        />
      )}
      {modal === "topic" && (
        <NewTopicModal
          classDataMap={classDataMap}
          currentClassId={selectedClassId}
          onClose={() => setModal(null)}
          onCreate={handleCreateTopic}
        />
      )}
    </div>
  );
}
