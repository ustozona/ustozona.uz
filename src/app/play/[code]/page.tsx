import { Suspense } from "react";
import PlayView from "./_components/PlayView";

/* `PlayView` `useSearchParams()` ishlatadi (`?game=<qobiq>`), shuning
   uchun Suspense chegarasi majburiy — Next.js aks holda butun sahifani
   dinamik render qilishga majbur qiladi. */

export default async function PlayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center text-muted-foreground">
          Yuklanmoqda...
        </div>
      }
    >
      <PlayView joinCode={code.toUpperCase()} />
    </Suspense>
  );
}
