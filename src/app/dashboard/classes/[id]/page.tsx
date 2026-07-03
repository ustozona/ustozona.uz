import { notFound } from "next/navigation";
import { resolveClassIdentity } from "@/lib/class-id";
import ClassDetail from "./_components/ClassDetail";
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

  const identity = resolveClassIdentity(decodeURIComponent(id));
  if (!identity) notFound();

  const initialSection: ClassSection = CLASS_SECTIONS.some((s) => s.key === b)
    ? (b as ClassSection)
    : "overview";

  return <ClassDetail identity={identity} initialSection={initialSection} />;
}
