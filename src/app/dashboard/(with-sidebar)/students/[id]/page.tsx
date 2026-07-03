import StudentProfile from "./_components/StudentProfile";

export default async function StudentProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  return <StudentProfile studentId={decodeURIComponent(id)} initialTab={tab} />;
}
