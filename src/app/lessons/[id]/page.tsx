import LessonEditor from "@/components/lesson-editor/LessonEditor";

export default async function LessonEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LessonEditor lessonId={id} />;
}
