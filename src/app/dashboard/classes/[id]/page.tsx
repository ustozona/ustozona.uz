import { ClassDetailResolver } from "./_components/ClassDetailResolver";
import { CLASS_SECTIONS, type ClassSection } from "./_components/sections";

export default async function ClassDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ b?: string }>;
}) {
  const { id } = await params;
  const { b } = await searchParams;

  const initialSection: ClassSection = CLASS_SECTIONS.some((s) => s.key === b)
    ? (b as ClassSection)
    : "overview";

  // Identitet client'da hal boʻladi (jonli sinflar server hydration'dan keyin
  // maʼlum) — shu sabab notFound qarori ham ClassDetailResolver'da.
  return <ClassDetailResolver id={decodeURIComponent(id)} initialSection={initialSection} />;
}
