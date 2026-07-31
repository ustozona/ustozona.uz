import PlayView from "./_components/PlayView";

export default async function PlayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <PlayView joinCode={code.toUpperCase()} />;
}
