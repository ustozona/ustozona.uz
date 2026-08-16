"use client";

import { useEffect, useState } from "react";
import { useGradesStore } from "@/store/useGradesStore";
import { useAssignmentEditorStore } from "@/store/useAssignmentEditorStore";
import AssignmentEditorOverlay from "@/app/dashboard/(with-sidebar)/assignments/_components/AssignmentEditorOverlay";

/**
 * Topshiriq muharririning GLOBAL langari — `dashboard/layout.tsx`da bir marta
 * chiziladi. Ilgari muharrir sahifa komponenti ichida edi, shuning uchun
 * boshqa boʻlimga oʻtish yozilayotgan qoralamani unmount qilib yoʻqotardi.
 * Endi u Gmail'ning "compose" oynasi kabi ilova ustida yashaydi.
 *
 * Sessiya `useAssignmentEditorStore`da (localStorage) — sahifa yangilansa
 * ham qoralama joyida qoladi. Render mount'dan keyin boshlanadi: persist
 * qilingan store server HTML'i bilan mos kelmasligi mumkin.
 */
export default function AssignmentEditorHost() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const session = useAssignmentEditorStore((s) => s.session);
  /* Parklangan sessiya — qoralama saqlanadi, muharrir chizilmaydi.
     U Topshiriqlar roʻyxatida karta boʻlib koʻrinadi. */
  const parked = useAssignmentEditorStore((s) => s.parked);
  const close = useAssignmentEditorStore((s) => s.close);
  const classDataMap = useGradesStore((s) => s.classDataMap);
  const hydrated = useGradesStore((s) => s._hasHydrated);

  /* Langar sinf yoki tahrirlanayotgan topshiriq yoʻqolgan boʻlsa (boshqa
     joyda oʻchirilgan, sinf arxivlangan) — sessiyani tashlaymiz, aks holda
     muharrir boʻsh maʼlumot ustida chiziladi. */
  useEffect(() => {
    if (!hydrated || !session) return;
    const cd = classDataMap[session.classId];
    if (!cd) {
      close();
      return;
    }
    if (session.kind === "edit" && !cd.assignments.some((a) => a.id === session.assignmentId)) {
      close();
    }
  }, [hydrated, session, classDataMap, close]);

  if (!mounted || !hydrated || !session || parked) return null;

  const cd = classDataMap[session.classId];
  if (!cd) return null;
  if (session.kind === "edit" && !cd.assignments.some((a) => a.id === session.assignmentId)) {
    return null;
  }

  return <AssignmentEditorOverlay session={session} />;
}
