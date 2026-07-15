import LessonsServerSync from "@/components/sync/LessonsServerSync";

/* Dars muharriri /dashboard tashqarisida — sync koʻprigi shu yerda ham
   turishi shart, aks holda muharrirdagi oʻzgarishlar serverga yetmaydi. */
export default function LessonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LessonsServerSync />
      {children}
    </>
  );
}
