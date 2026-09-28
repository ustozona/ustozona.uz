import LessonEditor from "@/components/lesson-editor/LessonEditor";

/** `?panel=` — muharrir qaysi yon panel bilan ochilishi (`plan` — Reja
    ustasi). Notanish qiymat eʼtiborsiz: standart «Tafsilotlar». */
const PANELS = ["details", "ai", "plan"] as const;

export default async function LessonEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const { panel } = await searchParams;
  const initialPanel = PANELS.find((p) => p === panel);
  return <LessonEditor lessonId={id} initialPanel={initialPanel} />;
}
