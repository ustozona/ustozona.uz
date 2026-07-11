/* ════════════════════════════════════════════════════════════════════
   VAZIFALAR TUR DEMO MAʼLUMOTI — faqat vizual, store'ga YOZILMAYDI.

   Tasks turʼi boʻsh hisobda ishga tushsa (hali vazifa yoʻq) boʻsh
   panellar tur davomida namunaviy sinflar + turli holat/muddat/
   ustuvorlikdagi vazifalar bilan toʻldiriladi (standards-tour-demo.ts
   bilan bir xil naqsh — [[standards-tour-demo]]).
   ════════════════════════════════════════════════════════════════════ */

import type { ClassColor } from "@/lib/class-colors";
import type { ClassInfo } from "@/lib/grades-data";
import { TASK_STATUS, type Task } from "@/lib/tasks-data";

export const TASKS_TOUR_DEMO_CLASS_IDS = {
  math: "demo-tasks-cl-1",
  uzbek: "demo-tasks-cl-2",
  physics: "demo-tasks-cl-3",
} as const;

export function makeTasksTourDemoClasses(): ClassInfo[] {
  return [
    { id: TASKS_TOUR_DEMO_CLASS_IDS.math, name: "Matematika 7-A", subject: "Matematika", color: "sky" as ClassColor },
    { id: TASKS_TOUR_DEMO_CLASS_IDS.uzbek, name: "Ona tili 8-B", subject: "Ona tili", color: "green" as ClassColor },
    { id: TASKS_TOUR_DEMO_CLASS_IDS.physics, name: "Fizika 9-A", subject: "Fizika", color: "amber" as ClassColor },
  ];
}

const today = new Date();
const formatDate = (d: Date) => d.toISOString().split("T")[0];
const addDays = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return formatDate(d);
};

function baseTask(t: Partial<Task> & { id: string; title: string }): Task {
  return {
    description: "",
    dueDate: null,
    endDate: null,
    dueTime: null,
    endTime: null,
    isRecurring: false,
    recurrenceRule: null,
    mentions: [],
    priority: "none",
    status: TASK_STATUS.TODO,
    classIds: [],
    assigneeIds: [],
    tags: [],
    comments: [],
    attachments: [],
    subtasks: [],
    pomodoroSessions: [],
    estimatedPomodoros: 1,
    createdAt: formatDate(today),
    completedAt: null,
    ...t,
  };
}

export function makeTasksTourDemoTasks(): Task[] {
  const { math, uzbek, physics } = TASKS_TOUR_DEMO_CLASS_IDS;
  return [
    baseTask({
      id: "demo-task-1",
      title: "3-choraklik davomat hisobotini tayyorlash",
      dueDate: addDays(-2),
      priority: "high",
      status: TASK_STATUS.IN_PROGRESS,
      tags: ["hisobot"],
    }),
    baseTask({
      id: "demo-task-2",
      title: "Sinf jurnalini toʻldirish",
      dueDate: addDays(-1),
      priority: "high",
      status: TASK_STATUS.TODO,
      classIds: [math],
      tags: ["jurnal"],
    }),
    baseTask({
      id: "demo-task-3",
      title: "Yangi dars rejasini tayyorlash",
      dueDate: formatDate(today),
      priority: "medium",
      status: TASK_STATUS.TODO,
      classIds: [uzbek],
      tags: ["dars", "reja"],
    }),
    baseTask({
      id: "demo-task-4",
      title: "Nazorat ishi natijalarini kiritish",
      dueDate: formatDate(today),
      priority: "high",
      status: TASK_STATUS.IN_PROGRESS,
      classIds: [math],
      tags: ["baholash"],
    }),
    baseTask({
      id: "demo-task-5",
      title: "Ota-onalar majlisi haqida xabar yuborish",
      dueDate: addDays(2),
      priority: "medium",
      status: TASK_STATUS.TODO,
      classIds: [physics],
      tags: ["majlis", "ota-onalar"],
    }),
    baseTask({
      id: "demo-task-6",
      title: "Laboratoriya ishi uchun materiallarni tayyorlash",
      dueDate: addDays(3),
      priority: "medium",
      status: TASK_STATUS.TODO,
      classIds: [physics],
      tags: ["resurs"],
    }),
    baseTask({
      id: "demo-task-7",
      title: "Maktab tadbiriga ssenariy yozish",
      dueDate: null,
      priority: "none",
      status: TASK_STATUS.TODO,
      classIds: [],
    }),
    baseTask({
      id: "demo-task-8",
      title: "Insholarni tekshirish va baholash",
      dueDate: addDays(-1),
      priority: "low",
      status: TASK_STATUS.DONE,
      classIds: [uzbek],
      tags: ["baholash"],
      completedAt: addDays(-1),
    }),
    baseTask({
      id: "demo-task-9",
      title: "Vocabulary testlarini tekshirish",
      dueDate: formatDate(today),
      priority: "low",
      status: TASK_STATUS.DONE,
      classIds: [uzbek],
      completedAt: formatDate(today),
    }),
  ];
}
